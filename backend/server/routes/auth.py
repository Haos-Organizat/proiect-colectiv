from typing import Any, Tuple
from flask import Blueprint, request, jsonify
from backend.application.auth.dto import RegisterDTO
from backend.application.auth.service import AuthService
from backend.infrastructure.user_repository import UserRepository

auth_bp: Blueprint = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/register", methods=["POST"])
def register() -> Tuple[Any, int]:

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
