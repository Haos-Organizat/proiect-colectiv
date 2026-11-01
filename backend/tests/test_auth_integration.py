import os

import pytest
from backend.domain.user import User
from backend.infrastructure.user_repository import UserRepository
from supabase import Client, create_client


@pytest.fixture(scope="module")
def real_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not key:
        pytest.skip(
            "SUPABASE_SERVICE_ROLE_KEY nu este setata in .env, sarim testele de integrare reala."
        )

    return create_client(url, key)


@pytest.fixture
def user_repo(real_supabase_client) -> UserRepository:
    return UserRepository(real_supabase_client)


def test_db_save_and_get_by_email_real(user_repo):
    test_email = "integrare.reala@test.com"
    user_repo.supabase.table("users").delete().eq("email", test_email).execute()

    new_user = User(
        id=None,
        email=test_email,
        password_hash="hash_de_test_123",
        first_name="Test",
        last_name="Integrare",
    )

    saved_user = user_repo.save(new_user)
    assert saved_user.id is not None
    fetched_user = user_repo.get_by_email(test_email)
    assert fetched_user is not None
    assert fetched_user.first_name == "Test"
    assert fetched_user.last_name == "Integrare"

    # Curatam baza de date dupa rularea testului ca sa ramana curata
    user_repo.supabase.table("users").delete().eq("email", test_email).execute()
