from typing import Any

from backend.domain.eveniment import Eveniment


class EvenimentRepository:
    """Persists events in the `events` table (see supabase/migrations).

    The domain and the API use Romanian names; the table keeps the English column names
    of the initial schema, so the mapping lives here.
    """

    TABLE = "events"

    def __init__(self, supabase_client: Any = None) -> None:
        self.supabase = supabase_client
        self._local_storage: list[Eveniment] = []

    @staticmethod
    def to_row(eveniment: Eveniment) -> dict[str, Any]:
        row: dict[str, Any] = {
            "title": eveniment.titlu,
            "description": eveniment.descriere,
            "category": eveniment.categorie,
            "start_time": eveniment.data_ora,
            "location": eveniment.loc,
            "capacity": eveniment.numar_locuri,
            # No organizations table yet: the organizer is the user who created the event.
            "organizer_id": eveniment.creator_id,
            "status": eveniment.status,
        }
        if eveniment.poza is not None:
            row["image_url"] = eveniment.poza
        return row

    def save(self, eveniment: Eveniment) -> Eveniment:
        if self.supabase is not None:
            response = self.supabase.table(self.TABLE).insert(self.to_row(eveniment)).execute()
            if getattr(response, "data", None):
                eveniment.id = response.data[0].get("id")
                return eveniment

        if eveniment.id is None:
            eveniment.id = len(self._local_storage) + 1
        self._local_storage.append(eveniment)
        return eveniment
