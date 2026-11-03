from dataclasses import dataclass


@dataclass
class RegisterDTO:
    email: str | None
    password: str
    confirm_password: str
    first_name: str
    last_name: str
    birth_date: str | None = None
    phone: str | None = None

    def __post_init__(self):
        self.email = (self.email or "").strip().lower()
