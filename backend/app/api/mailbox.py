from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.schemas.mailbox import MailboxOut
from app.db.base import get_db
from app.models.mailbox import Mailbox
from app.schemas.mailbox import MailboxCreate  # asegúrate de tener este schema
from sqlalchemy import select
from fastapi import HTTPException, Path

router = APIRouter(prefix="/mailboxes", tags=["mailboxes"])

@router.get("/", response_model=List[MailboxOut])
async def get_mailboxes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Mailbox))
    mailboxes = result.scalars().all()
    return mailboxes

@router.post("/", response_model=MailboxOut)
async def create_mailbox(data: MailboxCreate, db: AsyncSession = Depends(get_db)):
    mailbox = Mailbox(**data.dict())
    db.add(mailbox)
    await db.commit()
    await db.refresh(mailbox)
    return mailbox

@router.post("/{mailbox_id}/verify")
async def verify_mailbox(mailbox_id: int = Path(...), db: AsyncSession = Depends(get_db)):
    mailbox = await db.get(Mailbox, mailbox_id)
    if not mailbox:
        raise HTTPException(status_code=404, detail="Mailbox not found")
    mailbox.is_verified = True
    await db.commit()
    await db.refresh(mailbox)
    return {"message": "Mailbox verified", "id": mailbox.id}