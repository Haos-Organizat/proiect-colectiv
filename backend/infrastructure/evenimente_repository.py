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
        self._local_inscrieri: list[dict[str, Any]] = []

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

    def get_by_id(self, event_id: int) -> Eveniment | None:
        if self.supabase is not None:
            response = self.supabase.table(self.TABLE).select("*").eq("id", int(event_id)).execute()
            rows = getattr(response, "data", None) or []
            if rows:
                row = rows[0]
                return Eveniment(
                    id=row.get("id"),
                    titlu=row.get("title", ""),
                    descriere=row.get("description", ""),
                    categorie=row.get("category", ""),
                    data_ora=str(row.get("start_time", "")),
                    loc=row.get("location", ""),
                    numar_locuri=row.get("capacity") or 0,
                    organizatie_id=row.get("organizer_id"),
                    creator_id=row.get("organizer_id"),
                    status=row.get("status", "activ"),
                    poza=row.get("image_url"),
                )
            return None

        for ev in self._local_storage:
            if ev.id == int(event_id):
                return ev
        return None

    def add_inscriere(self, inscriere: dict[str, Any]) -> None:
        self._local_inscrieri.append(inscriere)

    def get_inscrieri_by_eveniment(self, event_id: int) -> list[dict[str, Any]]:
        if self.supabase is not None:
            response = (
                self.supabase.table("tickets").select("*").eq("event_id", int(event_id)).execute()
            )
            return list(getattr(response, "data", None) or [])

        return [
            i
            for i in self._local_inscrieri
            if i.get("event_id") == int(event_id) or i.get("eveniment_id") == int(event_id)
        ]

    def get_organizatie_nume(self, organizer_id: int | None) -> str | None:
        if organizer_id is None:
            return None
        if self.supabase is not None:
            response = (
                self.supabase.table("users")
                .select("first_name, last_name")
                .eq("id", int(organizer_id))
                .execute()
            )
            rows = getattr(response, "data", None) or []
            if rows:
                u = rows[0]
                full_name = f"{u.get('first_name', '')} {u.get('last_name', '')}".strip()
                if full_name:
                    return full_name
        return None

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
