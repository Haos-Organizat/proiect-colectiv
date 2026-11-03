from typing import Any

import pytest
from backend.application.auth.dto import RegisterDTO
from backend.application.auth.service import AuthService
from backend.domain.user import User
from backend.server.routes.auth import auth_bp
from flask import Flask, jsonify
from flask_login import LoginManager
from werkzeug.security import check_password_hash, generate_password_hash


# MOCK REPOSITORY (Simulează baza de date în memorie pentru teste)
class MockUserRepository:
    def __init__(self) -> None:
        self.users: dict[str, User] = {}
        self.save_called: bool = False

    def get_by_email(self, email: str) -> User | None:
        if not email:
            return None
        return self.users.get(email.strip().lower())

    def get_by_id(self, user_id: Any) -> User | None:
        for user in self.users.values():
            if str(user.id) == str(user_id):
                return user
        return None

    def save(self, user: User) -> User:
        user.id = len(self.users) + 1
        self.users[user.email.strip().lower()] = user
        self.save_called = True
        return user


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

    saved_user: User | None = repo.get_by_email("test@example.com")
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

    dto_short: RegisterDTO = RegisterDTO("t@e.com", "Ps1", "Ps1", "A", "B")
    res_short = service.register_user(dto_short)
    assert res_short["code"] == 400
    assert "password" in res_short["errors"]

    dto_no_upper: RegisterDTO = RegisterDTO("t@e.com", "password123", "password123", "A", "B")
    res_no_upper = service.register_user(dto_no_upper)
    assert res_no_upper["code"] == 400
    assert "password" in res_no_upper["errors"]


def test_service_register_multiple_errors_simultaneously() -> None:
    repo: MockUserRepository = MockUserRepository()
    service: AuthService = AuthService(repo)

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


def test_service_login_success() -> None:
    repo = MockUserRepository()
    service = AuthService(repo)
    repo.save(
        User(
            id=1,
            email="ion@test.ro",
            password_hash=generate_password_hash("Parola123"),
            first_name="Ion",
            last_name="Pop",
            status="activ",
        )
    )

    res = service.authenticate_user("ion@test.ro", "Parola123")
    assert res["code"] == 200
    assert res["user"].email == "ion@test.ro"


def test_service_login_wrong_password_and_nonexistent() -> None:
    repo = MockUserRepository()
    service = AuthService(repo)
    repo.save(
        User(
            id=1,
            email="ion@test.ro",
            password_hash=generate_password_hash("Parola123"),
            first_name="Ion",
            last_name="Pop",
            status="activ",
        )
    )

    # Parolă greșită -> 401 cu mesajul general
    res_wrong = service.authenticate_user("ion@test.ro", "Gresita123")
    assert res_wrong["code"] == 401
    assert res_wrong["error"] == "Email sau parolă greșite"

    # Cont inexistent -> 401 cu același mesaj general
    res_none = service.authenticate_user("inexistent@test.ro", "Parola123")
    assert res_none["code"] == 401
    assert res_none["error"] == "Email sau parolă greșite"


def test_service_login_deactivated_account() -> None:
    repo = MockUserRepository()
    service = AuthService(repo)
    repo.save(
        User(
            id=2,
            email=" blocat@test.ro",
            password_hash=generate_password_hash("Parola123"),
            first_name="Ana",
            last_name="Pop",
            status="dezactivat",
        )
    )

    res = service.authenticate_user("blocat@test.ro", "Parola123")
    assert res["code"] == 403


@pytest.fixture
def mock_repo() -> MockUserRepository:
    repo = MockUserRepository()
    repo.save(
        User(
            id=1,
            email="activ@test.ro",
            password_hash=generate_password_hash("Parola123"),
            first_name="User",
            last_name="Activ",
            status="activ",
        )
    )
    repo.save(
        User(
            id=2,
            email="dezactivat@test.ro",
            password_hash=generate_password_hash("Parola123"),
            first_name="User",
            last_name="Dezactivat",
            status="dezactivat",
        )
    )
    return repo


@pytest.fixture
def client(mock_repo: MockUserRepository, monkeypatch: Any) -> Any:
    app: Flask = Flask(__name__)
    app.secret_key = "test-secret"
    app.config["TESTING"] = True
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Neautentificat"}), 401

    @login_manager.user_loader
    def load_user(user_id: str):
        return mock_repo.get_by_id(user_id)

    # Înlocuim UserRepository din ruta auth cu mock_repo pentru teste
    monkeypatch.setattr(
        "backend.server.routes.auth.UserRepository", lambda *args, **kwargs: mock_repo
    )

    app.register_blueprint(auth_bp)
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
