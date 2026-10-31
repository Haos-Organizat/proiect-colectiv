from dataclasses import dataclass
from typing import Optional


@dataclass
class RegisterDTO:
    email: Optional[str]
    password: str
    confirm_password: str
    first_name: str
    last_name: str
    birth_date: Optional[str] = None
    phone: Optional[str] = None

    def __post_init__(self):
            self.email = (self.email or "").strip().lower()
