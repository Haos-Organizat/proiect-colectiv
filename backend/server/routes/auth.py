from typing import Any, Tuple
from flask import Blueprint, request, jsonify
from backend.application.auth.dto import RegisterDTO
from backend.application.auth.service import AuthService
from backend.infrastructure.user_repository import UserRepository

auth_bp: Blueprint = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/register', methods=['POST'])
def register() -> Tuple[Any, int]:
    """Schimbăm tipul returnat în Tuple[Any, int] ca Pylance să accepte formatul Flask"""
    # 1. Rezolvăm importul circular aducând modulul la nivel local
    import backend.api.index as api_index
    
    # 2. Extragem dinamic instanța de Supabase
    supabase_obj: Any = getattr(api_index, 'supabase_client', getattr(api_index, 'supabase', None))
    
    # 3. Construim instanțele necesare pe loc pentru acest request
    user_repo = UserRepository(supabase_obj)
    auth_service = AuthService(user_repo)
    
    # 4. Preluăm JSON-ul trimis de client
    data: Any = request.get_json() or {}
    
    dto: RegisterDTO = RegisterDTO(
        email=str(data.get('email', '')),
        password=str(data.get('password', '')),
        confirm_password=str(data.get('confirm_password', '')),
        first_name=str(data.get('first_name', '')),
        last_name=str(data.get('last_name', '')),
        birth_date=data.get('birth_date'),
        phone=data.get('phone')
    )
    
    result: dict[str, Any] = auth_service.register_user(dto)
    
    if "error" in result:
        return jsonify({"error": result["error"]}), int(result["code"])
        
    return jsonify(result["user"]), int(result["code"])
