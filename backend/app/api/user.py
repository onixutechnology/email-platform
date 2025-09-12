from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.user import UserOut
from app.db.base import get_db
from app.models.user import User
from sqlalchemy import select


router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserOut])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users
