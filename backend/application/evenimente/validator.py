from datetime import UTC, datetime
from typing import Any

CATEGORII_PERMISE: set[str] = {
    "academic",
    "academice",
    "cariera",
    "carieră",
    "sport",
    "voluntariat",
    "cultura",
    "cultură",
    "cultural",
    "social",
    "sociale",
    "workshop",
    "conferinta",
    "conferință",
    "tehnologie",
    "it",
    "arta",
    "artă",
    "muzica",
    "muzică",
    "petrecere",
    "educatie",
    "educație",
    "altele",
}


class EvenimentValidator:
    @staticmethod
    def validate(data: dict[str, Any]) -> dict[str, str]:
        errors: dict[str, str] = {}

        titlu = data.get("titlu")
        if not isinstance(titlu, str) or not titlu.strip() or len(titlu.strip()) > 100:
            errors["titlu"] = "Titlul nu poate fi gol și trebuie să aibă maximum 100 de caractere."

        descriere = data.get("descriere")
        if not isinstance(descriere, str) or not descriere.strip() or len(descriere.strip()) > 2000:
            errors["descriere"] = (
                "Descrierea nu poate fi goală și trebuie să aibă maximum 2000 de caractere."
            )

        categorie = data.get("categorie")
        if (
            not isinstance(categorie, str)
            or not categorie.strip()
            or categorie.strip().lower() not in CATEGORII_PERMISE
        ):
            errors["categorie"] = "Categoria selectată este invalidă."

        loc = data.get("loc")
        if not isinstance(loc, str) or not loc.strip() or len(loc.strip()) > 100:
            errors["loc"] = "Locul nu poate fi gol și trebuie să aibă maximum 100 de caractere."

        # Suportă atât "locuri" (contract KAN-21), cât și "numar_locuri" (KAN-33)
        has_locuri_key = "locuri" in data and "numar_locuri" not in data
        raw_locuri = data.get("locuri") if has_locuri_key else data.get("numar_locuri")
        if raw_locuri is None and "locuri" in data:
            raw_locuri = data.get("locuri")

        if (
            isinstance(raw_locuri, bool)
            or not isinstance(raw_locuri, int)
            or not (1 <= raw_locuri <= 10000)
        ):
            msg = "Numărul de locuri trebuie să fie un întreg între 1 și 10.000."
            errors["locuri" if has_locuri_key else "numar_locuri"] = msg

        data_ora = data.get("data_ora")
        if not isinstance(data_ora, str) or not data_ora.strip():
            errors["data_ora"] = "Data și ora sunt obligatorii."
        else:
            try:
                normalized_iso = data_ora.strip().replace("Z", "+00:00")
                dt = datetime.fromisoformat(normalized_iso)
                now = datetime.now(UTC) if dt.tzinfo is not None else datetime.now()
                if dt <= now:
                    errors["data_ora"] = "Data și ora trebuie să fie în viitor."
            except (ValueError, TypeError):
                errors["data_ora"] = "Formatul datei și orei este invalid."

        return errors
