from typing import Any

from backend.application.evenimente.validator import EvenimentValidator
from backend.domain.eveniment import Eveniment


class EvenimentService:
    def __init__(
        self,
        eveniment_repository: Any,
        creator_id: int | None = None,
        organizatie_id: int | None = None,
    ) -> None:
        self.eveniment_repository = eveniment_repository
        self.creator_id = creator_id
        self.organizatie_id = organizatie_id if organizatie_id is not None else creator_id

    def get_eveniment_by_id(self, event_id: Any, user_id: int | None = None) -> dict[str, Any]:
        if isinstance(event_id, bool):
            return {"error": "Evenimentul nu a fost găsit.", "code": 404}
        try:
            parsed_id = int(event_id)
        except (ValueError, TypeError):
            return {"error": "Evenimentul nu a fost găsit.", "code": 404}

        if parsed_id <= 0:
            return {"error": "Evenimentul nu a fost găsit.", "code": 404}

        get_by_id_fn = getattr(self.eveniment_repository, "get_by_id", None)
        ev: Eveniment | None = get_by_id_fn(parsed_id) if callable(get_by_id_fn) else None
        if ev is None:
            return {"error": "Evenimentul nu a fost găsit.", "code": 404}

        get_inscrieri_fn = getattr(self.eveniment_repository, "get_inscrieri_by_eveniment", None)
        inscrieri: list[dict[str, Any]] = (
            get_inscrieri_fn(parsed_id) if callable(get_inscrieri_fn) else []
        )

        # Locurile rămase se calculează doar din înscrierile cu status activa.
        inscrieri_active = [
            i
            for i in inscrieri
            if isinstance(i, dict) and str(i.get("status", "")).strip().lower() == "activa"
        ]
        locuri_ramase = max(0, ev.numar_locuri - len(inscrieri_active))

        get_org_fn = getattr(self.eveniment_repository, "get_organizatie_nume", None)
        organizatie = (
            get_org_fn(ev.organizatie_id or ev.creator_id) if callable(get_org_fn) else None
        ) or "Organizație studențească"

        este_inscris = False
        bilet_id: Any = None
        if user_id is not None:
            for i in inscrieri_active:
                uid = i.get("user_id") if i.get("user_id") is not None else i.get("utilizator_id")
                if uid is not None and int(uid) == int(user_id):
                    este_inscris = True
                    bilet_id = i.get("id")
                    break

        details = ev.to_dict()
        details["locuri_ramase"] = locuri_ramase
        details["organizatie"] = organizatie
        details["este_inscris"] = este_inscris
        details["bilet_id"] = bilet_id
        return {"eveniment": details, "code": 200}

    def list_evenimente(
        self, categorie: str | None = None, query: str | None = None
    ) -> list[dict[str, Any]]:
        list_fn = getattr(self.eveniment_repository, "list_all", None)
        evenimente: list[Eveniment] = list_fn() if callable(list_fn) else []
        cat_filter = (categorie or "").strip().lower()
        q_filter = (query or "").strip().lower()

        aliases: dict[str, set[str]] = {
            "sport": {"sport"},
            "tech": {"tech", "it", "tehnologie"},
            "it": {"tech", "it", "tehnologie"},
            "culture": {"culture", "cultura", "cultură", "cultural", "arta", "artă"},
            "cultura": {"culture", "cultura", "cultură", "cultural", "arta", "artă"},
            "cultură": {"culture", "cultura", "cultură", "cultural", "arta", "artă"},
            "party": {"party", "petrecere", "petreceri"},
            "petrecere": {"party", "petrecere", "petreceri"},
            "petreceri": {"party", "petrecere", "petreceri"},
            "volunteering": {"volunteering", "voluntariat"},
            "voluntariat": {"volunteering", "voluntariat"},
            "education": {
                "education",
                "educatie",
                "educație",
                "academic",
                "academice",
                "workshop",
                "conferinta",
                "conferință",
            },
            "educatie": {
                "education",
                "educatie",
                "educație",
                "academic",
                "academice",
                "workshop",
                "conferinta",
                "conferință",
            },
            "educație": {
                "education",
                "educatie",
                "educație",
                "academic",
                "academice",
                "workshop",
                "conferinta",
                "conferință",
            },
            "other": {"other", "altele", "social", "sociale"},
            "altele": {"other", "altele", "social", "sociale"},
        }
        allowed_cats = aliases.get(cat_filter, {cat_filter}) if cat_filter else set()

        result: list[dict[str, Any]] = []
        for ev in evenimente:
            if allowed_cats and ev.categorie.strip().lower() not in allowed_cats:
                continue
            if q_filter and q_filter not in f"{ev.titlu} {ev.loc}".lower():
                continue
            get_inscrieri_fn = getattr(
                self.eveniment_repository, "get_inscrieri_by_eveniment", None
            )
            inscrieri = (
                get_inscrieri_fn(ev.id) if callable(get_inscrieri_fn) and ev.id is not None else []
            )
            active_count = sum(
                1
                for i in inscrieri
                if isinstance(i, dict) and str(i.get("status", "")).strip().lower() == "activa"
            )
            item = ev.to_dict()
            item["locuri_ramase"] = max(0, ev.numar_locuri - active_count)
            result.append(item)
        return result

    def list_evenimente(
        self, categorie: str | None = None, query: str | None = None
    ) -> list[dict[str, Any]]:
        list_fn = getattr(self.eveniment_repository, "list_all", None)
        evenimente: list[Eveniment] = list_fn() if callable(list_fn) else []
        cat_filter = (categorie or "").strip().lower()
        q_filter = (query or "").strip().lower()

        aliases: dict[str, set[str]] = {
            "sport": {"sport"},
            "tech": {"tech", "it", "tehnologie"},
            "it": {"tech", "it", "tehnologie"},
            "culture": {"culture", "cultura", "cultură", "cultural", "arta", "artă"},
            "cultura": {"culture", "cultura", "cultură", "cultural", "arta", "artă"},
            "cultură": {"culture", "cultura", "cultură", "cultural", "arta", "artă"},
            "party": {"party", "petrecere", "petreceri"},
            "petrecere": {"party", "petrecere", "petreceri"},
            "petreceri": {"party", "petrecere", "petreceri"},
            "volunteering": {"volunteering", "voluntariat"},
            "voluntariat": {"volunteering", "voluntariat"},
            "education": {
                "education",
                "educatie",
                "educație",
                "academic",
                "academice",
                "workshop",
                "conferinta",
                "conferință",
            },
            "educatie": {
                "education",
                "educatie",
                "educație",
                "academic",
                "academice",
                "workshop",
                "conferinta",
                "conferință",
            },
            "educație": {
                "education",
                "educatie",
                "educație",
                "academic",
                "academice",
                "workshop",
                "conferinta",
                "conferință",
            },
            "other": {"other", "altele", "social", "sociale"},
            "altele": {"other", "altele", "social", "sociale"},
        }
        allowed_cats = aliases.get(cat_filter, {cat_filter}) if cat_filter else set()

        result: list[dict[str, Any]] = []
        for ev in evenimente:
            if allowed_cats and ev.categorie.strip().lower() not in allowed_cats:
                continue
            if q_filter and q_filter not in f"{ev.titlu} {ev.loc}".lower():
                continue
            get_inscrieri_fn = getattr(
                self.eveniment_repository, "get_inscrieri_by_eveniment", None
            )
            inscrieri = (
                get_inscrieri_fn(ev.id)
                if callable(get_inscrieri_fn) and ev.id is not None
                else []
            )
            active_count = sum(
                1
                for i in inscrieri
                if isinstance(i, dict) and str(i.get("status", "")).strip().lower() == "activa"
            )
            item = ev.to_dict()
            item["locuri_ramase"] = max(0, ev.numar_locuri - active_count)
            result.append(item)
        return result

    def create_eveniment(self, data: dict[str, Any]) -> dict[str, Any]:
        errors = EvenimentValidator.validate(data)
        if errors:
            return {"errors": errors, "code": 400}

        raw_locuri = (
            data.get("numar_locuri") if data.get("numar_locuri") is not None else data.get("locuri")
        )

        # organizatie_id și creator_id se iau exclusiv din utilizatorul autentificat;
        # dacă apar în cerere, sunt ignorate. Statusul inițial este "activ".
        ev = Eveniment(
            id=None,
            titlu=str(data.get("titlu", "")).strip(),
            descriere=str(data.get("descriere", "")).strip(),
            categorie=str(data.get("categorie", "")).strip(),
            data_ora=str(data.get("data_ora", "")).strip(),
            loc=str(data.get("loc", "")).strip(),
            numar_locuri=int(raw_locuri),  # type: ignore[arg-type]
            organizatie_id=self.organizatie_id,
            creator_id=self.creator_id,
            status="activ",
            poza=data.get("poza"),
        )

        saved_ev = self.eveniment_repository.save(ev)
        return {"eveniment": saved_ev.to_dict(), "code": 201}
