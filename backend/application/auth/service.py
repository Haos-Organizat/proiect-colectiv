from typing import Any, Dict
from werkzeug.security import generate_password_hash
from backend.domain.user import User
from backend.application.auth.dto import RegisterDTO
import backend.application.auth.validator # type: ignore

class AuthService:
    def __init__(self, user_repository: Any) -> None:
        """Adnotăm repository-ul cu Any pentru ca Pylance să nu se mai plângă că e necunoscut"""
        self.user_repository: Any = user_repository

    def register_user(self, dto: RegisterDTO) -> Dict[str, Any]:
        # 1. Rulăm validările sintactice (nume, prenume, parolă, email)
        error = backend.application.auth.validator.AuthValidator.validate_register(dto)
        if error:
            return {"error": error, "code": 400}

        # 2. Verificăm dacă emailul există deja în baza de date
        # dto.email este deja lowercase și stripuit datorită __post_init__ din RegisterDTO
        existing_user: Any = self.user_repository.get_by_email(dto.email)
        if existing_user:
            return {"error": "Acest email este deja înregistrat.", "code": 409}

        # 3. Hașurăm parola cu werkzeug (Criteriu Jira)
        pwd_hash: str = generate_password_hash(dto.password)

        # 4. Creăm entitatea de utilizator cu valorile implicite
        new_user: User = User(
            id=None,
            email=dto.email,
            password_hash=pwd_hash,
            first_name=dto.first_name.strip(),
            last_name=dto.last_name.strip(),
            birth_date=dto.birth_date,
            phone=dto.phone,
            role="participant",  # Criteriu Jira: rol implicit participant
            status="activ"       # Criteriu Jira: status implicit activ
        )

        # 5. Salvăm prin repository în baza de date
        saved_user: User = self.user_repository.save(new_user)
        
        # 6. Returnăm datele utilizatorului (saved_user.to_dict() ascunde complet parola/hash-ul)
        return {"user": saved_user.to_dict(), "code": 201}
