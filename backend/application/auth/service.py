from typing import Any, Dict
from werkzeug.security import generate_password_hash
from backend.domain.user import User
from backend.application.auth.dto import RegisterDTO
from backend.application.auth.validator import AuthValidator


class AuthService:
    def __init__(self, user_repository: Any) -> None:
        
        self.user_repository: Any = user_repository

    def register_user(self, dto: RegisterDTO) -> Dict[str, Any]:
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

        #Salvăm prin repository în baza de date
        saved_user: User = self.user_repository.save(new_user)

    
        return {"user": saved_user.to_dict(), "code": 201}
