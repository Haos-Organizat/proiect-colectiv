from typing import Any

from backend.application.auth.dto import RegisterDTO
from backend.application.auth.validator import AuthValidator
from backend.domain.user import User
from werkzeug.security import check_password_hash, generate_password_hash


class AuthService:
    def __init__(self, user_repository: Any) -> None:

        self.user_repository: Any = user_repository

    def register_user(self, dto: RegisterDTO) -> dict[str, Any]:
        errors = AuthValidator.validate_register(dto)
        if errors:
            return {"errors": errors, "code": 400}

        existing_user: Any = self.user_repository.get_by_email(dto.email)
        if existing_user:
            return {"errors": {"email": "Acest email este deja înregistrat."}, "code": 409}

        pwd_hash: str = generate_password_hash(dto.password)

        new_user: User = User(
            id=None,
            email=dto.email,
            password_hash=pwd_hash,
            first_name=dto.first_name.strip(),
            last_name=dto.last_name.strip(),
            birth_date=dto.birth_date,
            phone=dto.phone,
            role="participant",
            status="activ",
        )

        # Salvăm prin repository în baza de date
        saved_user: User = self.user_repository.save(new_user)

        return {"user": saved_user.to_dict(), "code": 201}

    def authenticate_user(self, email: str, password: str) -> dict[str, Any]:
        # 1. Căutăm utilizatorul după email folosind repository-ul
        user = self.user_repository.get_by_email(email)

        # 2. Dacă utilizatorul nu există sau parola este greșită -> returnăm eroare 401
        if not user or not check_password_hash(user.password_hash, password):
            return {"error": "Email sau parolă greșite", "code": 401}

        # 3. Dacă contul este dezactivat -> returnăm eroare 403
        if getattr(user, "status", "activ") == "dezactivat":
            return {"error": "Cont dezactivat", "code": 403}

        # 4. Dacă totul este corect, returnăm utilizatorul
        return {"user": user, "code": 200}
