from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.auth import authenticate_user, create_access_token
from app.db.base import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
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
