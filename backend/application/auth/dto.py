from dataclasses import dataclass
from typing import Optional

@dataclass
class RegisterDTO:
    email: str
    password: str
    confirm_password: str
    first_name: str
    last_name: str
    birth_date: Optional[str] = None
    phone: Optional[str] = None

    def __post_init__(self):
        """Rulează automat după inițializare. 
        Asigură criteriul Jira: email salvat cu litere mici și fără spații."""
        if self.email:
            self.email = self.email.strip().lower()
