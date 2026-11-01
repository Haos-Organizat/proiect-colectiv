import re

from backend.application.auth.dto import RegisterDTO


class AuthValidator:
    @staticmethod
    def validate_register(dto: RegisterDTO) -> dict[str, str]:
        errors = {}

        # Validare Prenume
        if not dto.first_name or len(dto.first_name.strip()) == 0:
            errors["first_name"] = "Prenumele este obligatoriu."
        elif len(dto.first_name) > 30:
            errors["first_name"] = "Prenumele trebuie să aibă maximum 30 de caractere."

        # Validare Nume
        if not dto.last_name or len(dto.last_name.strip()) == 0:
            errors["last_name"] = "Numele este obligatoriu."
        elif len(dto.last_name) > 30:
            errors["last_name"] = "Numele trebuie să aibă maximum 30 de caractere."

        # Validare Email (Corectată pentru a prinde și spațiile goale)
        if not dto.email or len(dto.email.strip()) == 0:
            errors["email"] = "Adresa de email este obligatorie."
        elif not re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", dto.email):
            errors["email"] = "Formatul adresei de email este invalid."

        # Validare Parolă
        password_errors = []
        if not dto.password:
            password_errors.append("Parola este obligatorie.")
        else:
            if len(dto.password) < 8:
                password_errors.append("Parola trebuie să aibă minimum 8 caractere.")
            if not any(c.isupper() for c in dto.password):
                password_errors.append("Parola trebuie să conțină cel puțin o literă mare.")
            if not any(c.islower() for c in dto.password):
                password_errors.append("Parola trebuie să conțină cel puțin o literă mică.")

        if password_errors:
            errors["password"] = " ".join(password_errors)

        # Validare Confirmare Parolă
        if dto.password != dto.confirm_password:
            errors["confirm_password"] = "Parola și confirmarea parolei nu coincid."

        return errors
