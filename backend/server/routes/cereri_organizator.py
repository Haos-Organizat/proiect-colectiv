from typing import Any

from backend.application.cereri_organizator.service import CereriOrganizatorService
from backend.infrastructure.cereri_organizator_repository import CereriOrganizatorRepository
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from backend.server.routes.evenimente import rol_necesar

cereri_organizator_bp = Blueprint("cereri_organizator", __name__)

EROARE_SERVER="A apărut o eroare, încearcă din nou."

def _service() -> CereriOrganizatorService:
    import backend.api.index as api_index

    supabase_obj: Any = getattr(api_index, "supabase_client", getattr(api_index, "supabase", None))
    return CereriOrganizatorService(CereriOrganizatorRepository(supabase_obj))

def _raspuns(result: dict[str, Any], cheie: str) -> tuple[Any, int]:
    if "errors" in result:
        return jsonify({"errors": result["errors"]}), int(result["code"])
    if "error" in result:
        return jsonify({"error": result["error"]}), int(result["code"])
    return jsonify(result[cheie]), int(result["code"])

@cereri_organizator_bp.route("/api/cereri-organizator/mea", methods=["GET"])
@login_required
def cererea_mea() -> tuple[Any, int]:
    try:
        cerere = _service().cererea_mea(current_user.id)
    except Exception:  
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

@cereri_organizator_bp.route("/api/admin/cereri-organizator", methods=["GET"])
@rol_necesar("admin")
def lista_cereri() -> tuple[Any, int]:
    status = request.args.get("status", "in_asteptare")
    try:
        result = _service().lista_pentru_admin(status)
    except Exception:  
        return jsonify({"error": EROARE_SERVER}), 500
    return _raspuns(result, "cereri")


@cereri_organizator_bp.route("/api/admin/cereri-organizator/numar", methods=["GET"])
@rol_necesar("admin")
def numar_cereri() -> tuple[Any, int]:
    try:
        numar = _service().numar_in_asteptare()
    except Exception:  # noqa: BLE001
        return jsonify({"error": EROARE_SERVER}), 500
    return jsonify({"in_asteptare": numar}), 200


@cereri_organizator_bp.route(
    "/api/admin/cereri-organizator/<int:cerere_id>/aproba", methods=["POST"]
)
@rol_necesar("admin")
def aproba_cerere(cerere_id: int) -> tuple[Any, int]:
    try:
        result = _service().aproba(cerere_id)
    except Exception:  
        return jsonify({"error": EROARE_SERVER}), 500
    return _raspuns(result, "cerere")


@cereri_organizator_bp.route(
    "/api/admin/cereri-organizator/<int:cerere_id>/respinge", methods=["POST"]
)
@rol_necesar("admin")
def respinge_cerere(cerere_id: int) -> tuple[Any, int]:
    data: dict[str, Any] = request.get_json(silent=True) or {}
    try:
        result = _service().respinge(cerere_id, data)
    except Exception:  
        return jsonify({"error": EROARE_SERVER}), 500
    return _raspuns(result, "cerere")