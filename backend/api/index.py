import os
import sys

from dotenv import load_dotenv  # Importăm utilitarul de încărcare env
from flask import Flask, jsonify
from flask_login import LoginManager
from supabase import Client, create_client

# Forțăm Python să recunoască rădăcina proiectului și folderul backend-ului
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
for path in (PROJECT_ROOT, BACKEND_DIR):
    if path not in sys.path:
        sys.path.append(path)

# Încărcăm variabilele de mediu din fișierul .env aflat în rădăcina proiectului (sau backend)
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

# 1. ÎNTÂI creăm instanța aplicației Flask
app = Flask(__name__)

# Configurări pentru sesiune și securitate cookie (cerință KAN-31)
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.secret_key = os.environ.get("SECRET_KEY", "cheie-secreta-de-dezvoltare")

# Inițializare Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.unauthorized_handler
def unauthorized():
    return {"error": "Neautentificat"}, 401


from backend.infrastructure.user_repository import UserRepository


@login_manager.user_loader
def load_user(user_id):
    supabase_obj = getattr(app, "supabase_client", supabase)
    repo = UserRepository(supabase_obj)
    return repo.get_by_id(user_id)


# Conexiunea Supabase
supabase_url: str = os.environ.get("SUPABASE_URL", "http://localhost:54321")
supabase_key: str = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not supabase_key:
    supabase_key = "dummy-local-development-key-placeholder"

supabase: Client = create_client(supabase_url, supabase_key)
app.supabase_client = supabase


# 2. APOI importăm și înregistrăm blueprint-urile
from backend.server.routes.auth import auth_bp
from backend.server.routes.evenimente import evenimente_bp

app.register_blueprint(auth_bp)
app.register_blueprint(evenimente_bp)


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
