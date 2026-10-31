from typing import Any, Optional
import pytest
from werkzeug.security import check_password_hash
from flask import Flask
from backend.application.auth.dto import RegisterDTO
from backend.application.auth.service import AuthService
from backend.domain.user import User
from backend.server.routes.auth import auth_bp

# ----------------------------------------------------------------------
# 1. MOCK REPOSITORY (Simulează baza de date în memorie pentru teste)
# ----------------------------------------------------------------------
class MockUserRepository:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}
        self.save_called: bool = False

    def get_by_email(self, email: str) -> Optional[User]:
        return self.users.get(email.strip().lower())

    def save(self, user: User) -> User:
        user.id = 1  # Simulăm generarea unui ID de tip INT
        self.users[user.email] = user
        self.save_called = True
        return user

# ----------------------------------------------------------------------
# 2. TESTE PENTRU SERVICIU (AuthService)
# ----------------------------------------------------------------------
def test_service_register_success_and_hashing() -> None:
    """Verifică înregistrarea cu succes și faptul că parola e hașuită cu werkzeug (nu în clar)"""
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)
    
    dto: RegisterDTO = RegisterDTO(
        email="test@example.com",
        password="Password123",
        confirm_password="Password123",
        first_name="John",
        last_name="Doe"
    )
    
    result: dict[str, Any] = service.register_user(dto)
    
    # Verificăm status codul 201 (Creat)
    assert result["code"] == 201
    # Verificăm că răspunsul NU conține parola sau hash-ul ei (Criteriu Jira)
    assert "password" not in result["user"]
    assert "password_hash" not in result["user"]
    
    # Verificăm în repo că parola a fost criptată corect
    saved_user: Optional[User] = repo.get_by_email("test@example.com")
    assert saved_user is not None
    assert saved_user.password_hash != "Password123"  # Nu e în clar
    assert check_password_hash(saved_user.password_hash, "Password123")  # Validată de werkzeug

def test_service_register_duplicate_email() -> None:
    """Verifică regula de email duplicat (Criteriu Jira: răspuns 409)"""
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)
    
    dto: RegisterDTO = RegisterDTO(
        email="duplicate@example.com",
        password="Password123",
        confirm_password="Password123",
        first_name="John",
        last_name="Doe"
    )
    
    # Prima înregistrare reușește
    service.register_user(dto)
    
    # A doua înregistrare cu același email trebuie să returneze 409
    result: dict[str, Any] = service.register_user(dto)
    assert result["code"] == 409
    assert "error" in result
    assert result["error"] == "Acest email este deja înregistrat."

def test_service_register_invalid_password_rules() -> None:
    """Verifică regulile de validare pentru parolă (min 8 caractere, litere mari/mici)"""
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)
    
    # Caz 1: Parolă prea scurtă
    dto_short: RegisterDTO = RegisterDTO("t@e.com", "Ps1", "Ps1", "A", "B")
    assert service.register_user(dto_short)["code"] == 400
    
    # Caz 2: Lipsește litera mare
    dto_no_upper: RegisterDTO = RegisterDTO("t@e.com", "password123", "password123", "A", "B")
    assert service.register_user(dto_no_upper)["code"] == 400

    # Caz 3: Lipsește litera mică
    dto_no_lower: RegisterDTO = RegisterDTO("t@e.com", "PASSWORD123", "PASSWORD123", "A", "B")
    assert service.register_user(dto_no_lower)["code"] == 400

# ----------------------------------------------------------------------
# 3. TESTE PENTRU API (Endpoint HTTP Flask)
# ----------------------------------------------------------------------
@pytest.fixture
def client() -> Any:
    """Fixture care configurează un client local de test Flask"""
    app: Flask = Flask(__name__)
    app.register_blueprint(auth_bp)
    app.config["TESTING"] = True
    return app.test_client()

def test_api_register_201(client: Any) -> None:
    """Test endpoint HTTP succes (201)"""
    payload: dict[str, str] = {
        "email": "api_success@example.com",
        "password": "Password123",
        "confirm_password": "Password123",
        "first_name": "Alex",
        "last_name": "Popescu"
    }
    # Folosim patch sau modificăm starea repo-ului dacă e necesar, 
    # dar fiind un mediu izolat, verificăm structura răspunsului HTTP direct.
    response: Any = client.post('/api/auth/register', json=payload)
    assert response.status_code == 201
    assert "id" in response.get_json()

def test_api_register_400_invalid_data(client: Any) -> None:
    """Test endpoint HTTP date invalide (400)"""
    payload: dict[str, str] = {
        "email": "invalid-email-format",
        "password": "123",
        "confirm_password": "123",
        "first_name": "",
        "last_name": "Popescu"
    }
    response: Any = client.post('/api/auth/register', json=payload)
    assert response.status_code == 400
    assert "error" in response.get_json()
