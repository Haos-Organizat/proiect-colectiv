from datetime import datetime, timedelta
from typing import Any

import backend.api.index as api_index
from backend.application.evenimente.service import EvenimentService
from backend.domain.eveniment import Eveniment
from backend.domain.user import User
from werkzeug.security import generate_password_hash


class MockEvenimentRepository:
    def __init__(self) -> None:
        self.saved: list[Eveniment] = []

    def save(self, eveniment: Eveniment) -> Eveniment:
        eveniment.id = len(self.saved) + 1
        self.saved.append(eveniment)
        return eveniment


def _valid_payload() -> dict[str, Any]:
    future_dt = (datetime.now() + timedelta(days=7)).isoformat()
    return {
        "titlu": "Hackathon UniConnect",
        "descriere": "Competiție de programare pentru studenți.",
        "categorie": "academic",
        "data_ora": future_dt,
        "loc": "Cluj-Napoca, FSEGA",
        "locuri": 150,
    }


def test_create_eveniment_success_and_ignores_spoofed_ids() -> None:
    repo = MockEvenimentRepository()
    service = EvenimentService(repo, creator_id=10, organizatie_id=25)

    payload = _valid_payload()
    payload["organizatie_id"] = 999
    payload["creator_id"] = 888
    payload["status"] = "inactiv"

    result = service.create_eveniment(payload)
    assert result["code"] == 201
    ev = result["eveniment"]
    assert ev["id"] == 1
    assert ev["organizatie_id"] == 25
    assert ev["creator_id"] == 10
    assert ev["status"] == "activ"
    assert ev["locuri"] == 150
    assert ev["numar_locuri"] == 150


def test_create_eveniment_validation_errors() -> None:
    repo = MockEvenimentRepository()
    service = EvenimentService(repo, creator_id=1, organizatie_id=1)

    past_dt = (datetime.now() - timedelta(days=1)).isoformat()
    invalid_payload: dict[str, Any] = {
        "titlu": "",
        "descriere": "x" * 2001,
        "categorie": "categorie_inexistenta",
        "data_ora": past_dt,
        "loc": "   ",
        "numar_locuri": 10001,
    }

    result = service.create_eveniment(invalid_payload)
    assert result["code"] == 400
    errors = result["errors"]
    assert "titlu" in errors
    assert "descriere" in errors
    assert "categorie" in errors
    assert "data_ora" in errors
    assert "loc" in errors
    assert "numar_locuri" in errors


def test_api_evenimente_requires_organizator_role(monkeypatch: Any) -> None:
    app = api_index.app
    app.config["TESTING"] = True

    participant = User(
        id=2,
        email="student@ubbcluj.ro",
        password_hash=generate_password_hash("Parola123!"),
        first_name="Ion",
        last_name="Pop",
        role="participant",
        status="activ",
    )
    organizator = User(
        id=3,
        email="org@ubbcluj.ro",
        password_hash=generate_password_hash("Parola123!"),
        first_name="Ana",
        last_name="Org",
        role="organizator",
        status="activ",
    )
    users_by_id = {2: participant, 3: organizator}
    users_by_email = {participant.email: participant, organizator.email: organizator}

    class FakeUserRepo:
        def __init__(self, _db: Any = None) -> None:
            pass

        def get_by_id(self, uid: int) -> User | None:
            return users_by_id.get(int(uid))

        def get_by_email(self, email: str) -> User | None:
            return users_by_email.get(email)

    monkeypatch.setattr("backend.api.index.UserRepository", FakeUserRepo)
    monkeypatch.setattr("backend.server.routes.auth.UserRepository", FakeUserRepo)
    monkeypatch.setattr(api_index, "supabase_client", None, raising=False)
    monkeypatch.setattr(api_index, "supabase", None, raising=False)

    client = app.test_client()

    # 1. Neautentificat -> 401
    res_unauth = client.post("/api/evenimente", json=_valid_payload())
    assert res_unauth.status_code == 401

    # 2. Autentificat ca participant -> 403
    client.post(
        "/api/auth/login",
        json={"email": "student@ubbcluj.ro", "password": "Parola123!"},
    )
    res_forbidden = client.post("/api/evenimente", json=_valid_payload())
    assert res_forbidden.status_code == 403
    client.post("/api/auth/logout")

    # 3. Autentificat ca organizator -> 201
    client.post(
        "/api/auth/login",
        json={"email": "org@ubbcluj.ro", "password": "Parola123!"},
    )
    payload = _valid_payload()
    payload["creator_id"] = 999
    payload["organizatie_id"] = 999
    res_ok = client.post("/api/evenimente", json=payload)
    assert res_ok.status_code == 201
    data = res_ok.get_json()
    assert data["id"] is not None
    assert data["creator_id"] == 3
    assert data["organizatie_id"] == 3
    assert data["status"] == "activ"
