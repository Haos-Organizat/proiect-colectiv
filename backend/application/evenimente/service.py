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

    def search_evenimente(self, titlu: str = "") -> list[dict[str, Any]]:
        evenimente = self.eveniment_repository.search_by_title(titlu)
        return [ev.to_dict() for ev in evenimente]
