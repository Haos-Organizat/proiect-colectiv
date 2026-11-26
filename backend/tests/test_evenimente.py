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
        "categorie": "IT",
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


def test_get_eveniment_by_id_calculates_locuri_ramase_only_from_activa() -> None:
    from backend.infrastructure.evenimente_repository import EvenimentRepository

    repo = EvenimentRepository(supabase_client=None)
    ev = Eveniment(
        id=1,
        titlu="Hackathon UniConnect",
        descriere="Competiție de programare pentru studenți.",
        categorie="tehnologie",
        data_ora="2026-12-01T18:00:00+02:00",
        loc="Cluj-Napoca, FSEGA",
        numar_locuri=10,
        organizatie_id=3,
        creator_id=3,
        poza="https://example.com/cover.webp",
    )
    repo.save(ev)

    # Adăugăm înscrieri cu diverse statusuri: doar cele cu status "activa" scad locurile rămase
    repo.add_inscriere({"id": 101, "event_id": 1, "user_id": 2, "status": "activa"})
    repo.add_inscriere({"id": 102, "event_id": 1, "user_id": 4, "status": "activa"})
    repo.add_inscriere({"id": 103, "event_id": 1, "user_id": 5, "status": "anulata"})
    repo.add_inscriere({"id": 104, "event_id": 1, "user_id": 6, "status": "inactiva"})

    service = EvenimentService(eveniment_repository=repo)

    # Vizitator / utilizator neînscris
    res_guest = service.get_eveniment_by_id(1)
    assert res_guest["code"] == 200
    data_guest = res_guest["eveniment"]
    assert data_guest["titlu"] == "Hackathon UniConnect"
    assert data_guest["locuri_ramase"] == 8
    assert data_guest["este_inscris"] is False
    assert data_guest["bilet_id"] is None

    # Utilizator deja înscris cu status activa (user_id=2)
    res_enrolled = service.get_eveniment_by_id(1, user_id=2)
    assert res_enrolled["code"] == 200
    assert res_enrolled["eveniment"]["este_inscris"] is True
    assert res_enrolled["eveniment"]["bilet_id"] == 101

    # Utilizator cu înscriere anulată (user_id=5) nu este considerat înscris activ
    res_cancelled = service.get_eveniment_by_id(1, user_id=5)
    assert res_cancelled["code"] == 200
    assert res_cancelled["eveniment"]["este_inscris"] is False
    assert res_cancelled["eveniment"]["bilet_id"] is None


def test_get_eveniment_by_id_nonexistent_returns_404(monkeypatch: Any) -> None:
    from backend.infrastructure.evenimente_repository import EvenimentRepository

    app = api_index.app
    app.config["TESTING"] = True

    repo = EvenimentRepository(supabase_client=None)
    ev = Eveniment(
        id=1,
        titlu="Workshop Python",
        descriere="Introducere în Flask.",
        categorie="workshop",
        data_ora="2026-12-10T14:00:00+02:00",
        loc="FSEGA, Sala 101",
        numar_locuri=30,
        organizatie_id=3,
        creator_id=3,
    )
    repo.save(ev)
    repo.add_inscriere({"id": 201, "event_id": 1, "user_id": 2, "status": "activa"})
    repo.add_inscriere({"id": 202, "event_id": 1, "user_id": 3, "status": "anulata"})

    monkeypatch.setattr(
        "backend.server.routes.evenimente.EvenimentRepository", lambda _db=None: repo
    )
    monkeypatch.setattr(api_index, "supabase_client", None, raising=False)
    monkeypatch.setattr(api_index, "supabase", None, raising=False)

    client = app.test_client()

    # ID existent -> 200 și locuri_ramase = 29 (doar înscrierea activa este numărată)
    res_ok = client.get("/api/evenimente/1")
    assert res_ok.status_code == 200
    body = res_ok.get_json()
    assert body["id"] == 1
    assert body["titlu"] == "Workshop Python"
    assert body["locuri_ramase"] == 29

    # ID inexistent -> 404
    res_not_found = client.get("/api/evenimente/9999")
    assert res_not_found.status_code == 404
    assert "error" in res_not_found.get_json()

    res_not_found_en = client.get("/api/events/9999")
    assert res_not_found_en.status_code == 404
    assert "error" in res_not_found_en.get_json()

    res_invalid_id = client.get("/api/evenimente/inexistent")
    assert res_invalid_id.status_code == 404


def test_categorii_evenimente_list_and_validation() -> None:
    from backend.application.evenimente.validator import (
        CATEGORII_PRINCIPALE,
        EvenimentValidator,
    )

    assert CATEGORII_PRINCIPALE == [
        "sport",
        "IT",
        "cultură",
        "petreceri",
        "voluntariat",
        "educație",
        "altele",
    ]

    for cat in CATEGORII_PRINCIPALE:
        payload = _valid_payload()
        payload["categorie"] = cat
        assert EvenimentValidator.validate(payload) == {}

    for invalid_cat in ("workshop", "concert", "career", "tech", "academic"):
        payload = _valid_payload()
        payload["categorie"] = invalid_cat
        assert "categorie" in EvenimentValidator.validate(payload)

    app = api_index.app
    app.config["TESTING"] = True
    client = app.test_client()
    res = client.get("/api/categorii")
    assert res.status_code == 200
    assert res.get_json() == CATEGORII_PRINCIPALE


def test_repository_maps_eveniment_to_events_table_columns() -> None:
    from backend.infrastructure.evenimente_repository import EvenimentRepository

    ev = Eveniment(
        id=None,
        titlu="Hackathon UniConnect",
        descriere="Competiție de programare pentru studenți.",
        categorie="IT",
        data_ora="2026-12-01T18:00:00+02:00",
        loc="Cluj-Napoca, FSEGA",
        numar_locuri=150,
        organizatie_id=3,
        creator_id=3,
        poza="https://example.com/cover.webp",
    )

    assert EvenimentRepository.TABLE == "events"
    assert EvenimentRepository.to_row(ev) == {
        "title": "Hackathon UniConnect",
        "description": "Competiție de programare pentru studenți.",
        "category": "IT",
        "start_time": "2026-12-01T18:00:00+02:00",
        "location": "Cluj-Napoca, FSEGA",
        "capacity": 150,
        "organizer_id": 3,
        "status": "activ",
        "image_url": "https://example.com/cover.webp",
    }
