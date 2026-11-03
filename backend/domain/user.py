from dataclasses import dataclass
from datetime import date, datetime


@dataclass
class User:
    id: int | None
    email: str
    password_hash: str
    first_name: str
    last_name: str
    birth_date: date | None = None
    phone: str | None = None
    role: str = "participant"  # Criteriu: rol implicit 'participant'
    status: str = "activ"  # Criteriu: status implicit 'activ'
    created_at: datetime | None = None

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_active(self) -> bool:
        return self.status == "activ"

    @property
    def is_anonymous(self) -> bool:
        return False

    def get_id(self) -> str:
        return str(self.id) if self.id is not None else ""

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "birth_date": str(self.birth_date) if self.birth_date else None,
            "phone": self.phone,
            "role": self.role,
            "status": self.status,
        }
