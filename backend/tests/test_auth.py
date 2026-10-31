from typing import Any, Optional
import pytest
from werkzeug.security import check_password_hash
from flask import Flask
from backend.application.auth.dto import RegisterDTO
from backend.application.auth.service import AuthService
from backend.domain.user import User
from backend.server.routes.auth import auth_bp 

# MOCK REPOSITORY (Simulează baza de date în memorie pentru teste)
class MockUserRepository:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}
        self.save_called: bool = False

    def get_by_email(self, email: str) -> Optional[User]:
        return self.users.get(email.strip().lower())

    def save(self, user: User) -> User:
        user.id = 1 
        self.users[user.email] = user
        self.save_called = True
        return user


# TESTE PENTRU SERVICIU 
def test_service_register_success_and_hashing() -> None:
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)

    dto: RegisterDTO = RegisterDTO(
        email="test@example.com",
        password="Password123",
        confirm_password="Password123",
        first_name="John",
        last_name="Doe",
    )

    result: dict[str, Any] = service.register_user(dto)

    assert result["code"] == 201
    assert "password" not in result["user"]
    assert "password_hash" not in result["user"]

    saved_user: Optional[User] = repo.get_by_email("test@example.com")
    assert saved_user is not None
    assert saved_user.password_hash != "Password123"
    assert check_password_hash(saved_user.password_hash, "Password123") 


def test_service_register_duplicate_email() -> None:
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)

    dto: RegisterDTO = RegisterDTO(
        email="duplicate@example.com",
        password="Password123",
        confirm_password="Password123",
        first_name="John",
        last_name="Doe",
    )

    service.register_user(dto)

    result: dict[str, Any] = service.register_user(dto)
    assert result["code"] == 409
    assert "errors" in result
    assert result["errors"]["email"] == "Acest email este deja înregistrat."


def test_service_register_invalid_password_rules() -> None:
    """Verifică regulile de validare pentru parolă (min 8 caractere, litere mari/mici)"""
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)

    # Caz 1: Parolă prea scurtă
    dto_short: RegisterDTO = RegisterDTO("t@e.com", "Ps1", "Ps1", "A", "B")
    res_short = service.register_user(dto_short)
    assert res_short["code"] == 400
    assert "password" in res_short["errors"]

    # Caz 2: Lipsește litera mare
    dto_no_upper: RegisterDTO = RegisterDTO("t@e.com", "password123", "password123", "A", "B")
    res_no_upper = service.register_user(dto_no_upper)
    assert res_no_upper["code"] == 400
    assert "password" in res_no_upper["errors"]


def test_service_register_multiple_errors_simultaneously() -> None:
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)

    # Lăsăm numele gol și punem o parolă scurtă 
    dto: RegisterDTO = RegisterDTO(
        email="valid@email.com",
        password="abc",
        confirm_password="abc",
        first_name="",
        last_name="Popescu",
    )

    result: dict[str, Any] = service.register_user(dto)
    
    assert result["code"] == 400
    assert "errors" in result
    assert "first_name" in result["errors"]
    assert "password" in result["errors"]


# TESTE PENTRU API (Endpoint HTTP Flask)
@pytest.fixture
def client() -> Any:
    app: Flask = Flask(__name__)
    app.register_blueprint(auth_bp)
    app.config["TESTING"] = True
    return app.test_client()


def test_api_register_400_invalid_data(client: Any) -> None:
    payload: dict[str, str] = {
        "email": "invalid-email-format",
        "password": "123",
        "confirm_password": "123",
        "first_name": "",
        "last_name": "Popescu",
    }
    response: Any = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert "errors" in json_data
    assert "email" in json_data["errors"]
    assert "first_name" in json_data["errors"]
    assert "password" in json_data["errors"]
