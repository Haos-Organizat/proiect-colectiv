from typing import Any, Protocol

MAX_NUME_ORGANIZATIE = 60
MAX_MESAJ = 300


class CereriRepository(Protocol):
    def ultima_cerere(self, user_id: int) -> dict[str, Any] | None: ...
    def nume_organizatie_folosit(self, nume: str) -> bool: ...
    def creeaza(self, user_id: int, nume: str, mesaj: str | None) -> dict[str, Any]: ...


def cerere_publica(cerere: dict[str, Any] | None) -> dict[str, Any] | None:
    if cerere is None:
        return None
    return {
        "id": cerere["id"],
        "organization_name": cerere["organization_name"],
        "message": cerere.get("message"),
        "status": cerere["status"],
        "created_at": cerere.get("created_at"),
    }


class CereriOrganizatorService:
    def __init__(self, repository: CereriRepository) -> None:
        self.repo = repository

    def cererea_mea(self, user_id: int) -> dict[str, Any] | None:
        return cerere_publica(self.repo.ultima_cerere(user_id))

    def trimite_cerere(self, user: Any, data: dict[str, Any]) -> dict[str, Any]:
        """Validează și salvează cererea. Întoarce {"cerere", "code"} sau {"errors"/"error", "code"}."""
        if getattr(user, "role", None) != "participant":
            return {"error": "Doar participanții pot cere un cont de organizator.", "code": 409}

        ultima = self.repo.ultima_cerere(user.id)
        if ultima is not None and ultima["status"] == "in_asteptare":
            return {"error": "Ai deja o cerere în așteptare.", "code": 409}

        nume = str(data.get("organization_name") or "").strip()
        mesaj_brut = data.get("message")
        mesaj = str(mesaj_brut).strip() if mesaj_brut is not None else ""

        errors: dict[str, str] = {}
        if not nume:
            errors["organization_name"] = "Numele organizației este obligatoriu."
        elif len(nume) > MAX_NUME_ORGANIZATIE:
            errors["organization_name"] = (
                f"Numele organizației poate avea maximum {MAX_NUME_ORGANIZATIE} de caractere."
            )
        if len(mesaj) > MAX_MESAJ:
            errors["message"] = f"Mesajul poate avea maximum {MAX_MESAJ} de caractere."
        if errors:
            return {"errors": errors, "code": 400}

        if self.repo.nume_organizatie_folosit(nume):
            return {
                "errors": {"organization_name": "Există deja o organizație cu acest nume."},
                "code": 409,
            }

        cerere = self.repo.creeaza(user.id, nume, mesaj or None)
        return {"cerere": cerere_publica(cerere), "code": 201}
