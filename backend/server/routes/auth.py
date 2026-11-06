from typing import Any

from backend.application.auth.dto import RegisterDTO
from backend.application.auth.service import AuthService
from backend.infrastructure.user_repository import UserRepository
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required, login_user, logout_user

auth_bp: Blueprint = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/register", methods=["POST"])
def register() -> tuple[Any, int]:
    import backend.api.index as api_index

    supabase_obj: Any = getattr(api_index, "supabase_client", getattr(api_index, "supabase", None))
    user_repo = UserRepository(supabase_obj)
    auth_service = AuthService(user_repo)
    data: Any = request.get_json() or {}

    dto: RegisterDTO = RegisterDTO(
        email=data.get("email"),
        password=data.get("password", ""),
        confirm_password=data.get("confirm_password", ""),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        birth_date=data.get("birth_date"),
        phone=data.get("phone"),
    )

    try:
        result: dict[str, Any] = auth_service.register_user(dto)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": f"Eroare la conectarea cu baza de date: {e}"}), 500

    if "errors" in result:
        return jsonify({"errors": result["errors"]}), int(result["code"])

    return jsonify(result["user"]), int(result["code"])


# 1. ENDPOINT LOGIN (acceptă atât /api/auth/login cât și /api/login)
@auth_bp.route("/api/auth/login", methods=["POST"])
@auth_bp.route("/api/login", methods=["POST"])
def login() -> tuple[Any, int]:
    import backend.api.index as api_index

    supabase_obj: Any = getattr(api_index, "supabase_client", getattr(api_index, "supabase", None))
    user_repo = UserRepository(supabase_obj)
    auth_service = AuthService(user_repo)

    data: Any = request.get_json() or {}
    email = data.get("email", "")
    password = data.get("password", "")

    # Opțiunea „Ține-mă minte”
    remember = bool(
        data.get("remember", False)
        or data.get("remember_me", False)
        or data.get("tine_ma_minte", False)
    )

    try:
        result = auth_service.authenticate_user(email, password)
    except Exception as e:  # noqa: BLE001
        return jsonify({"error": f"Eroare la conectarea cu baza de date: {e}"}), 500

    if "error" in result:
        return jsonify({"error": result["error"]}), int(result["code"])

    user = result["user"]
    login_user(user, remember=remember)

    user_data = user.to_dict() if hasattr(user, "to_dict") else {"id": user.id, "email": user.email}
    return jsonify(user_data), 200


# 2. ENDPOINT LOGOUT
@auth_bp.route("/api/auth/logout", methods=["POST"])
@auth_bp.route("/api/logout", methods=["POST"])
@login_required
def logout() -> tuple[Any, int]:
    logout_user()
    return jsonify({"message": "Deconectare reușită"}), 200


# 3. ENDPOINT /ME (returnează utilizatorul curent autentificat)
@auth_bp.route("/api/auth/me", methods=["GET"])
@auth_bp.route("/api/me", methods=["GET"])
@login_required
def me() -> tuple[Any, int]:
    if hasattr(current_user, "to_dict"):
        return jsonify(current_user.to_dict()), 200
    return jsonify(
        {
            "id": getattr(current_user, "id", None),
            "email": getattr(current_user, "email", None),
            "role": getattr(current_user, "role", "participant"),
            "status": getattr(current_user, "status", "activ"),
        }
    ), 200


# 4. ENDPOINT VIZUALIZARE PROFIL (GET)
@auth_bp.route("/api/auth/profile", methods=["GET"])
@auth_bp.route("/api/profile", methods=["GET"])
@login_required
def get_profile() -> tuple[Any, int]:
    """Returnează datele utilizatorului curent (prenume, nume, email) pentru pagina de profil."""
    user_data = (
        current_user.to_dict()
        if hasattr(current_user, "to_dict")
        else {
            "id": getattr(current_user, "id", None),
            "email": getattr(current_user, "email", None),
            "first_name": getattr(current_user, "first_name", ""),
            "last_name": getattr(current_user, "last_name", ""),
        }
    )

    # Mapăm/asigurăm compatibilitatea cu cerințele (first_name/last_name sau prenume/nume)
    response_data = {
        "email": user_data.get("email"),
        "first_name": user_data.get("first_name") or user_data.get("prenume", ""),
        "last_name": user_data.get("last_name") or user_data.get("nume", ""),
    }
    return jsonify(response_data), 200


# 5. ENDPOINT MODIFICARE PROFIL (PUT)
@auth_bp.route("/api/auth/profile", methods=["PUT"])
@auth_bp.route("/api/profile", methods=["PUT"])
@login_required
def update_profile() -> tuple[Any, int]:
    """Modifică doar prenumele și numele utilizatorului. Emailul rămâne neschimbat."""
    data: Any = request.get_json() or {}

    # Preluăm noile valori pentru prenume și nume (acceptă atât first_name/last_name cât și prenume/nume)
    new_first_name = data.get("first_name") or data.get("prenume")
    new_last_name = data.get("last_name") or data.get("nume")

    # Validări obligatorii
    errors = {}
    if not new_first_name or not str(new_first_name).strip():
        errors["first_name"] = "Prenumele este obligatoriu."
    if not new_last_name or not str(new_last_name).strip():
        errors["last_name"] = "Numele este obligatoriu."

    if errors:
        return jsonify({"errors": errors}), 400

    try:
        import backend.api.index as api_index

        supabase_obj: Any = getattr(api_index, "supabase_client", getattr(api_index, "supabase", None))
        user_repo = UserRepository(supabase_obj)

        current_user.first_name = str(new_first_name).strip()
        current_user.last_name = str(new_last_name).strip()
        user_repo.update(current_user)

        updated_data = (
            current_user.to_dict()
            if hasattr(current_user, "to_dict")
            else {
                "email": current_user.email,
                "first_name": current_user.first_name,
                "last_name": current_user.last_name,
            }
        )

        return jsonify(
            {
                "message": "Profil actualizat cu succes",
                "profile": {
                    "email": updated_data.get("email"),
                    "first_name": updated_data.get("first_name") or updated_data.get("prenume"),
                    "last_name": updated_data.get("last_name") or updated_data.get("nume"),
                },
            }
        ), 200

    except Exception as e:  # noqa: BLE001
        return jsonify({"error": str(e)}), 500
