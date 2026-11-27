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

    def lista(self, status: str) -> list[dict[str, Any]]:
        response = (
            self.supabase.table(self.TABLE)
            .select("*")
            .eq("status", status)
            .order("created_at", desc=status != "in_asteptare")
            .execute()
        )
        return list(response.data or [])

    def utilizatori(self, ids: list[int]) -> dict[int, dict[str, Any]]:
        if not ids:
            return {}
        response = (
            self.supabase.table("users")
            .select("id, first_name, last_name, email")
            .in_("id", ids)
            .execute()
        )
        return {row["id"]: row for row in response.data or []}

    def numar_in_asteptare(self) -> int:
        response = (
            self.supabase.table(self.TABLE)
            .select("id", count="exact")
            .eq("status", "in_asteptare")
            .limit(1)
            .execute()
        )
        return int(response.count or 0)

    def gaseste(self, cerere_id: int) -> dict[str, Any] | None:
        response = self.supabase.table(self.TABLE).select("*").eq("id", cerere_id).execute()
        return response.data[0] if response.data else None

    def aproba(self, cerere_id: int) -> str:
        response = self.supabase.rpc(
            "aproba_cerere_organizator", {"p_cerere_id": cerere_id}
        ).execute()
        return str(response.data)

    def respinge(self, cerere_id: int, motiv: str | None) -> bool:
        response = (
            self.supabase.table(self.TABLE)
            .update({"status": "respinsa", "rejection_reason": motiv})
            .eq("id", cerere_id)
            .eq("status", "in_asteptare")
            .execute()
        )
        return bool(response.data)