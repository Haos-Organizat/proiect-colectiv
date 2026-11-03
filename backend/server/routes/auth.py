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

    result: dict[str, Any] = auth_service.register_user(dto)

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

    result = auth_service.authenticate_user(email, password)

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
