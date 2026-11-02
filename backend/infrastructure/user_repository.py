from typing import Any, Optional
from backend.domain.user import User


class UserRepository:
    def __init__(self, supabase_client: Any) -> None:
        self.supabase: Any = supabase_client

    def get_by_email(self, email: str) -> Optional[User]:
        response: Any = (
            self.supabase.table("users").select("*").eq("email", email.strip().lower()).execute()
        )

        if response.data and len(response.data) > 0:
            u: Any = response.data[0]
            return User(
                id=u["id"],
                email=u["email"],
                password_hash=u["password_hash"],
                first_name=u["first_name"],
                last_name=u["last_name"],
                birth_date=u.get("birth_date"),
                phone=u.get("phone"),
                role="participant", 
                status="activ",  
            )
        return None

    def save(self, user: User) -> User:
        user_data: dict[str, Any] = {
            "email": user.email,
            "password_hash": user.password_hash,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "birth_date": str(user.birth_date) if user.birth_date else None,
            "phone": user.phone,
        }

        response: Any = self.supabase.table("users").insert(user_data).select().execute()

        if response.data and len(response.data) > 0:
            user.id = response.data[0]["id"]

        return user
