from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from app.db.base import get_db
from app.models.outgoing_domain import OutgoingDomain
from app.auth.auth import get_current_active_user
from app.models.user import User

router = APIRouter(prefix="/domains", tags=["domains"])

class DomainCreate(BaseModel):
    domain: str
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None

class DomainResponse(BaseModel):
    id: int
    domain: str
    smtp_host: Optional[str]
    smtp_port: int
    is_active: bool
    created_at: str

@router.post("/")
async def create_domain(
    domain_data: DomainCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Solo admins pueden crear dominios
    #if not any(role.name == "admin" for role in current_user.roles):
        #raise HTTPException(status_code=403, detail="No tienes permisos")#
    
    new_domain = OutgoingDomain(
        domain=domain_data.domain,
        smtp_host=domain_data.smtp_host,
        smtp_port=domain_data.smtp_port,
        smtp_user=domain_data.smtp_user,
        smtp_password=domain_data.smtp_password,
        created_by=current_user.id
    )
    
    db.add(new_domain)
    await db.commit()
    await db.refresh(new_domain)
    
    return {"success": True, "domain": new_domain.domain}

@router.get("/", response_model=List[DomainResponse])
async def list_domains(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(OutgoingDomain).where(OutgoingDomain.is_active == True)
    )
    domains = result.scalars().all()
    
    return [
        DomainResponse(
            id=d.id,
            domain=d.domain,
            smtp_host=d.smtp_host,
            smtp_port=d.smtp_port,
            is_active=d.is_active,
            created_at=d.created_at.isoformat()
        ) for d in domains
    ]

@router.delete("/{domain_id}")
async def delete_domain(
    domain_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not any(role.name == "admin" for role in current_user.roles):
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    result = await db.execute(select(OutgoingDomain).where(OutgoingDomain.id == domain_id))
    domain = result.scalar_one_or_none()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Dominio no encontrado")
    
    domain.is_active = False
    await db.commit()
    
    return {"success": True}
