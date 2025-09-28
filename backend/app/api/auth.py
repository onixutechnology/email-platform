# 👇 Asegúrate de importar 'status'
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.auth import authenticate_user, create_access_token
from app.db.base import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    
    # --- VALIDACIÓN DE LONGITUD DE CONTRASEÑA ---
    # Se agrega este bloque para evitar el error de bcrypt con contraseñas largas.
    if len(form_data.password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña es demasiado larga y no puede ser procesada."
        )
    # --- FIN DE LA VALIDACIÓN ---

    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Actualicé este código de estado para ser más específico
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Nombre de usuario o contraseña incorrectos"
        )
    
    token = create_access_token({"sub": user.username})

    # Maneja roles como lista de strings si tienes relación
    roles = [role.name for role in user.roles] if hasattr(user, 'roles') else []
    user_data = {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "email": user.email,
        "roles": roles
    }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }

