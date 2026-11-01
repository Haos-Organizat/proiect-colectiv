from typing import Any

from backend.domain.eveniment import Eveniment


class EvenimentRepository:
    def __init__(self, supabase_client: Any = None) -> None:
        self.supabase = supabase_client
        self._local_storage: list[Eveniment] = []

    def save(self, eveniment: Eveniment) -> Eveniment:
        if self.supabase is not None:
            payload: dict[str, Any] = {
                "titlu": eveniment.titlu,
                "descriere": eveniment.descriere,
                "categorie": eveniment.categorie,
                "data_ora": eveniment.data_ora,
                "loc": eveniment.loc,
                "numar_locuri": eveniment.numar_locuri,
                "organizatie_id": eveniment.organizatie_id,
                "creator_id": eveniment.creator_id,
                "status": eveniment.status,
            }
            if eveniment.poza is not None:
                payload["poza"] = eveniment.poza

            response = self.supabase.table("evenimente").insert(payload).execute()
            if getattr(response, "data", None):
                row = response.data[0]
                eveniment.id = row.get("id", 1)
                return eveniment

        if eveniment.id is None:
            eveniment.id = len(self._local_storage) + 1
        self._local_storage.append(eveniment)
        return eveniment
