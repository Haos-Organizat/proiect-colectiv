import re
from typing import Optional
from backend.application.auth.dto import RegisterDTO

class AuthValidator:
    @staticmethod
    def validate_register(dto: RegisterDTO) -> Optional[str]:
        # Validare Prenume și Nume (Criteriu Jira: nu sunt goale/nule, max 30 caractere)
        if not dto.first_name or len(dto.first_name.strip()) == 0 or len(dto.first_name) > 30:
            return "Prenumele este obligatoriu și trebuie să aibă maximum 30 de caractere."
        if not dto.last_name or len(dto.last_name.strip()) == 0 or len(dto.last_name) > 30:
            return "Numele este obligatoriu și trebuie să aibă maximum 30 de caractere."

        # Validare Email (Criteriu Jira: format valid)
        if not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", dto.email):
            return "Formatul adresei de email este invalid."

        # Validare Parolă (Criteriu Jira: min 8 caractere, o literă mare, una mică)
        if len(dto.password) < 8:
            return "Parola trebuie să aibă minimum 8 caractere."
        if not any(c.isupper() for c in dto.password):
            return "Parola trebuie să conțină cel puțin o literă mare."
        if not any(c.islower() for c in dto.password):
            return "Parola trebuie să conțină cel puțin o literă mică."
        
        # Validare Confirmare Parolă (Criteriu Jira: coincide cu confirmarea)
        if dto.password != dto.confirm_password:
            return "Parola și confirmarea parolei nu coincid."

        return None
