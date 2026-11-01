from collections.abc import Callable
from functools import wraps
from typing import Any

from backend.application.evenimente.service import EvenimentService
from backend.infrastructure.evenimente_repository import EvenimentRepository
from flask import Blueprint, jsonify, request
from flask_login import current_user

evenimente_bp = Blueprint("evenimente", __name__)


def rol_necesar(rol: str) -> Callable[..., Any]:
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            if not getattr(current_user, "is_authenticated", False):
                return jsonify({"error": "Autentificare necesară."}), 401
            is_active = getattr(current_user, "is_active", True)
            user_role = getattr(current_user, "role", None)
            if not is_active or user_role != rol:
                return (
                    jsonify({"error": f"Acces interzis. Rolul '{rol}' activ este necesar."}),
                    403,
                )
            return f(*args, **kwargs)

        return decorated_function

    return decorator


@evenimente_bp.route("/api/evenimente", methods=["POST"])
@rol_necesar("organizator")
def create_eveniment() -> tuple[Any, int]:
    import backend.api.index as api_index

    supabase_obj: Any = getattr(api_index, "supabase_client", getattr(api_index, "supabase", None))
    repo = EvenimentRepository(supabase_obj)

    user_id = getattr(current_user, "id", None)
    organizatie_id = getattr(current_user, "organizatie_id", user_id)

    service = EvenimentService(
        eveniment_repository=repo,
        creator_id=user_id,
        organizatie_id=organizatie_id,
    )

    data: dict[str, Any] = request.get_json(silent=True) or {}
    result = service.create_eveniment(data)

    if "errors" in result:
        return jsonify({"errors": result["errors"]}), int(result["code"])

    return jsonify(result["eveniment"]), int(result["code"])
