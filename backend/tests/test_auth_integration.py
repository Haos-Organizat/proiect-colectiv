import os
import pytest
from supabase import create_client, Client
from backend.domain.user import User
from backend.infrastructure.user_repository import UserRepository


@pytest.fixture(scope="module")
def real_supabase_client() -> Client:
    """Se conecteaza la instanta reala de Supabase Docker folosind cheile locale"""
    # Citim cheile din mediu (incarcate automat din .env de catre pytest-dotenv sau manual)
    url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not key:
        pytest.skip(
            "SUPABASE_SERVICE_ROLE_KEY nu este setata in .env, sarim testele de integrare reala."
        )

    return create_client(url, key)


@pytest.fixture
def user_repo(real_supabase_client) -> UserRepository:
    """Instantiaza repository-ul real legat la baza de date din Docker"""
    return UserRepository(real_supabase_client)


def test_db_save_and_get_by_email_real(user_repo):
    """Insereaza un utilizator in Supabase real si il cauta inapoi pentru a valida integrarea"""
    test_email = "integrare.reala@test.com"

    # Curatam preventiv daca a ramas din teste anterioare esuate
    user_repo.supabase.table("users").delete().eq("email", test_email).execute()

    new_user = User(
        id=None,
        email=test_email,
        password_hash="hash_de_test_123",
        first_name="Test",
        last_name="Integrare",
    )

    # 1. Testam salvarea reala (INSERT)
    saved_user = user_repo.save(new_user)
    assert saved_user.id is not None  # Baza de date reala i-a generat un ID!

    # 2. Testam cautarea reala (SELECT)
    fetched_user = user_repo.get_by_email(test_email)
    assert fetched_user is not None
    assert fetched_user.first_name == "Test"
    assert fetched_user.last_name == "Integrare"

    # 3. Curatam baza de date dupa rularea testului ca sa ramana curata (DELETE)
    user_repo.supabase.table("users").delete().eq("email", test_email).execute()
