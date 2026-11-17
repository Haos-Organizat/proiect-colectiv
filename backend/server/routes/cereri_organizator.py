from typing import Any

from backend.application.cereri_organizator.service import CereriOrganizatorService
from backend.infrastructure.cereri_organizator_repository import CereriOrganizatorRepository
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

cereri_organizator_bp = Blueprint("cereri_organizator", __name__)


def _service() -> CereriOrganizatorService:
    import backend.api.index as api_index

    supabase_obj: Any = getattr(api_index, "supabase_client", getattr(api_index, "supabase", None))
    return CereriOrganizatorService(CereriOrganizatorRepository(supabase_obj))


@cereri_organizator_bp.route("/api/cereri-organizator/mea", methods=["GET"])
@login_required
def cererea_mea() -> tuple[Any, int]:
    """Ultima cerere a utilizatorului logat: {"cerere": {...}} sau {"cerere": null}."""
    try:
        cerere = _service().cererea_mea(current_user.id)
    except Exception:  # noqa: BLE001
        return jsonify({"error": "A apărut o eroare, încearcă din nou."}), 500
    return jsonify({"cerere": cerere}), 200


@cereri_organizator_bp.route("/api/cereri-organizator", methods=["POST"])
@login_required
def trimite_cerere() -> tuple[Any, int]:
    data: dict[str, Any] = request.get_json(silent=True) or {}
    try:
        result = _service().trimite_cerere(current_user, data)
    except Exception:
        return jsonify({"error": "A apărut o eroare, încearcă din nou."}), 500

    if "errors" in result:
        return jsonify({"errors": result["errors"]}), int(result["code"])
    if "error" in result:
        return jsonify({"error": result["error"]}), int(result["code"])
    return jsonify(result["cerere"]), int(result["code"])
