from typing import Any


class CereriOrganizatorRepository:

    TABLE = "organizer_requests"

    def __init__(self, supabase_client: Any) -> None:
        self.supabase = supabase_client

    def ultima_cerere(self, user_id: int) -> dict[str, Any] | None:
        response = (
            self.supabase.table(self.TABLE)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None

    def nume_organizatie_folosit(self, nume: str) -> bool:
        model = nume.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        response = (
            self.supabase.table(self.TABLE)
            .select("id")
            .ilike("organization_name", model)
            .neq("status", "respinsa")
            .limit(1)
            .execute()
        )
        return bool(response.data)

    def creeaza(self, user_id: int, nume: str, mesaj: str | None) -> dict[str, Any]:
        row = {"user_id": user_id, "organization_name": nume, "message": mesaj}
        response = self.supabase.table(self.TABLE).insert(row).execute()
        return response.data[0]