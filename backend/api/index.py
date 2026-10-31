import os
import sys
from flask import Flask, jsonify
from supabase import create_client, Client
from dotenv import load_dotenv  # Importăm utilitarul de încărcare env

# Forțăm Python să recunoască folderul rădăcină al backend-ului
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Încărcăm variabilele de mediu din fișierul .env aflat în rădăcina proiectului
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

app = Flask(__name__)


supabase_url: str = os.environ.get("SUPABASE_URL", "http://localhost:54321")
supabase_key: str = os.environ.get("SUPABASE_KEY", "")


if not supabase_key:
    supabase_key = "dummy-local-development-key-placeholder"

supabase: Client = create_client(supabase_url, supabase_key)

from server.routes.auth import auth_bp
app.register_blueprint(auth_bp)

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
