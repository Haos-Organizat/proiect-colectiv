from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional


@dataclass
class User:
    id: Optional[int]
    email: str
    password_hash: str
    first_name: str
    last_name: str
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    role: str = "participant"  # Criteriu: rol implicit 'participant'
    status: str = "activ"  # Criteriu: status implicit 'activ'
    created_at: Optional[datetime] = None

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
