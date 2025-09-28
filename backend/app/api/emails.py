import os
import json
import logging
import smtplib
import asyncio
import boto3
import requests
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from botocore.exceptions import ClientError
from app.db.base import get_db
from app.models.email_log import EmailLog
from app.models.mailbox import Mailbox
from app.auth.auth import get_current_active_user
from app.models.user import User
from app.core.config import settings

# Advanced tracking imports
try:
    import user_agents
    import geoip2.database
except ImportError:
    user_agents = None
    geoip2 = None

BASE_URL = settings.EMAIL_PLATFORM_API_URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emails", tags=["emails"])

def add_tracking_pixel(html_body: str, email_log_id: int) -> str:
    if html_body:
        pixel_url = f"{BASE_URL}/emails/track/open/{email_log_id}.png"
        tracking_pixel = f'<img src="{pixel_url}" width="1" height="1" style="display:none;" />'
        logger.info(f"🔍 Agregando pixel de tracking: {pixel_url}")
        if "</body>" in html_body:
            html_body = html_body.replace("</body>", f"{tracking_pixel}</body>")
        else:
            html_body += tracking_pixel
        logger.info(f"✅ Pixel agregado correctamente")
    else:
        logger.warning(f"⚠️ No hay HTML body para agregar pixel al email {email_log_id}")
    return html_body

# Pydantic models
class EmailSend(BaseModel):
    to: EmailStr
    subject: str
    body: str
    html_body: Optional[str] = None
    mailbox_id: Optional[int] = None
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    attachments: Optional[List[str]] = None

class EmailResponse(BaseModel):
    id: int
    to_email: str
    from_email: str
    subject: str
    status: str
    created_at: str
    error_message: Optional[str]
    mailbox_id: int
    opened_at: Optional[str] = None
    open_count: Optional[int] = 0
    last_opened_at: Optional[str] = None
    tracking_data: Optional[Dict[str, Any]] = None

class EmailStats(BaseModel):
    total_sent: int
    total_failed: int
    success_rate: float
    last_24h: int

PROVIDER_CONFIGS = {
    'gmail': {
        'smtp_host': 'smtp.gmail.com',
        'smtp_port': 587,
        'use_tls': True
    },
    'outlook': {
        'smtp_host': 'smtp-mail.outlook.com',
        'smtp_port': 587,
        'use_tls': True
    },
    'yahoo': {
        'smtp_host': 'smtp.mail.yahoo.com',
        'smtp_port': 587,
        'use_tls': True
    }
}

class EmailSender:
    @staticmethod
    async def send_via_smtp(mailbox: Mailbox, to_email: str, subject: str, 
                           body: str, html_body: Optional[str] = None,
                           cc: Optional[List[str]] = None, 
                           bcc: Optional[List[str]] = None,
                           attachments: Optional[List[str]] = None) -> Dict[str, Any]:
        try:
            settings = json.loads(mailbox.settings)
            provider_lower = mailbox.provider.lower()
            if provider_lower in PROVIDER_CONFIGS:
                config = PROVIDER_CONFIGS[provider_lower]
                smtp_host = settings.get('smtp_host', config['smtp_host'])
                smtp_port = settings.get('smtp_port', config['smtp_port'])
                use_tls = settings.get('use_tls', config['use_tls'])
            else:
                smtp_host = settings.get('smtp_host')
                smtp_port = settings.get('smtp_port', 587)
                use_tls = settings.get('use_tls', True)
            username = settings.get('username')
            password = settings.get('password')
            if not all([smtp_host, username, password]):
                raise Exception("Configuración SMTP incompleta")
            logger.info(f"🔄 Conectando a SMTP: {smtp_host}:{smtp_port}")
            logger.info(f"🔄 Autenticando con: {username}")
            logger.info(f"🔄 Enviando desde: {mailbox.email}")

            from_name = mailbox.name or "Marketing ONIXU"
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{from_name} <{mailbox.email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg['Reply-To'] = mailbox.email
            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        with open(file_path, "rb") as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                            encoders.encode_base64(part)
                            part.add_header(
                                'Content-Disposition',
                                f'attachment; filename={os.path.basename(file_path)}'
                            )
                            msg.attach(part)
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html', 'utf-8'))
            server = smtplib.SMTP(smtp_host, smtp_port)
            if use_tls:
                server.starttls()
            server.login(username, password)
            result = server.send_message(msg, to_addrs=[to_email] + (cc or []) + (bcc or []))
            server.quit()
            logger.info(f"✅ Email SMTP enviado exitosamente")
            return {"success": True, "result": result}
        except smtplib.SMTPAuthenticationError as e:
            error_msg = f"Error de autenticación SMTP: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except smtplib.SMTPRecipientsRefused as e:
            error_msg = f"Destinatario rechazado: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
        except Exception as e:
            error_msg = f"Error SMTP: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}

    @staticmethod
    async def send_via_sendgrid_api(mailbox: Mailbox, to_email: str, subject: str, 
                                  body: str, html_body: Optional[str] = None,
                                  cc: Optional[List[str]] = None, 
                                  bcc: Optional[List[str]] = None) -> Dict[str, Any]:
        try:
            settings = json.loads(mailbox.settings)
            api_key = settings.get('sendgrid_api_key') or os.getenv('SENDGRID_API_KEY')
            
            if not api_key:
                raise Exception("SendGrid API key no configurada")
            
            logger.info(f"🔄 Enviando desde: {mailbox.email}")
            logger.info(f"🔄 Autenticando con SendGrid API")
            logger.info(f"🔄 Conectando a: SendGrid REST API")
            logger.info(f"   Proveedor: sendgrid")
            logger.info(f"   Hacia: {to_email}")
            logger.info(f"   Desde: {mailbox.email}")

            # Estructura del email para SendGrid API
            data = {
                "personalizations": [{
                    "to": [{"email": to_email}],
                    "subject": subject
                }],
                "from": {"email": mailbox.email, "name": mailbox.name or "ONIXU Marketing"},
                "content": []
            }
            
            # Agregar CC y BCC si existen
            if cc:
                data["personalizations"][0]["cc"] = [{"email": email} for email in cc]
            if bcc:
                data["personalizations"][0]["bcc"] = [{"email": email} for email in bcc]
            
            # Agregar contenido
            if body:
                data["content"].append({"type": "text/plain", "value": body})
            if html_body:
                data["content"].append({"type": "text/html", "value": html_body})
            
            # Enviar usando httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json=data,
                    timeout=30
                )
                
                if response.status_code in [200, 202]:
                    logger.info(f"✅ Email SendGrid API enviado exitosamente")
                    return {"success": True, "status_code": response.status_code}
                else:
                    error_msg = f"SendGrid API error: {response.status_code} - {response.text}"
                    logger.error(f"❌ {error_msg}")
                    return {"success": False, "error": error_msg}
                    
        except Exception as e:
            error_msg = f"Error SendGrid API: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}


async def send_email_background(
    to_email: str,
    subject: str,
    body: str,
    mailbox: Mailbox,
    user_id: int,
    db: AsyncSession,
    html_body: Optional[str] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    attachments: Optional[List[str]] = None,
    retry_count: int = 0
):
    email_log = EmailLog(
        to_email=to_email,
        from_email=mailbox.email,
        subject=subject,
        body=body,
        sent_by=user_id,
        mailbox_id=mailbox.id,
        status="pending"
    )
    db.add(email_log)
    await db.commit()
    await db.refresh(email_log)
    if html_body:
        html_body = add_tracking_pixel(html_body, email_log.id)
        logger.info(f"📧 Enviando email con HTML y pixel de tracking")
    else:
        logger.warning(f"⚠️ Email {email_log.id} enviado solo como texto plano - NO TRACKING")
    try:
        logger.info(f"🚀 ENVIANDO EMAIL (Intento {retry_count + 1}/3):")
        logger.info(f"   Desde: {mailbox.email}")
        logger.info(f"   Hacia: {to_email}")
        logger.info(f"   Proveedor: {mailbox.provider}")
        if not mailbox.is_verified:
            logger.warning(f"⚠️ Mailbox {mailbox.email} no está verificado")
        sender = EmailSender()
        provider_lower = mailbox.provider.lower()
        if provider_lower in ['gmail', 'outlook', 'yahoo', 'smtp'] or mailbox.provider.lower() == 'sendgrid':
            # Usar SendGrid API para todos los casos (más rápido que SMTP)
            result = await sender.send_via_sendgrid_api(
                mailbox, to_email, subject, body, html_body, cc, bcc
            )
        elif provider_lower == 'ses':
            result = await sender.send_via_ses(
                mailbox, to_email, subject, body, html_body
            )
        elif provider_lower == 'mailgun':
            result = await sender.send_via_mailgun(
                mailbox, to_email, subject, body, html_body
            )
        else:
            raise Exception(f"Proveedor {mailbox.provider} no soportado")
        if result['success']:
            email_log.status = "sent"
            logger.info("🎉 EMAIL ENVIADO EXITOSAMENTE")
        else:
            raise Exception(result['error'])
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Error enviando email: {error_msg}")
        if retry_count < 2:
            logger.info(f"🔄 Reintentando en 30 segundos...")
            await asyncio.sleep(30)
            return await send_email_background(
                to_email, subject, body, mailbox, user_id, db, 
                html_body, cc, bcc, attachments, retry_count + 1
            )
        else:
            email_log.status = "failed"
            email_log.error_message = error_msg
    db.add(email_log)
    await db.commit()
    logger.info(f"💾 Log guardado con status: {email_log.status}")

@router.get("/track/open/{email_id}.png")
async def track_email_open(
    email_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    transparent_gif = (
        b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
        b'\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,'
        b'\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x04\x01\x00;'
    )
    try:
        client_ip = getattr(request.client, 'host', 'unknown')
        user_agent_string = request.headers.get("user-agent", "Unknown")
        referrer = request.headers.get("referer", "")
        accept_language = request.headers.get("accept-language", "")
        tracking_data = {
            "ip": client_ip,
            "user_agent": user_agent_string,
            "referrer": referrer,
            "language": accept_language,
            "opened_at": datetime.utcnow().isoformat(),
            "timestamp": datetime.utcnow().timestamp()
        }
        if user_agents:
            ua = user_agents.parse(user_agent_string)
            tracking_data.update({
                "browser": ua.browser.family,
                "browser_version": ua.browser.version_string,
                "os": ua.os.family,
                "os_version": ua.os.version_string,
                "device": ua.device.family,
                "is_mobile": ua.is_mobile,
                "is_tablet": ua.is_tablet,
                "is_pc": ua.is_pc
            })

        result = await db.execute(select(EmailLog).where(EmailLog.id == email_id))
        log = result.scalar_one_or_none()
        if log:
            if not log.opened_at:
                log.opened_at = datetime.utcnow()
                log.open_count = 1
                log.last_opened_at = log.opened_at
                log.tracking_data = tracking_data
                logger.info(f"✅ Email {email_id} PRIMERA APERTURA")
            else:
                log.open_count = (log.open_count or 0) + 1
                log.last_opened_at = datetime.utcnow()
                td = log.tracking_data
                if td is None:
                    td = {"opens": []}
                elif isinstance(td, str):
                    try:
                        td = json.loads(td)
                    except Exception:
                        td = {"opens": []}
                if "opens" not in td:
                    td["opens"] = []
                td["opens"].append(tracking_data)
                log.tracking_data = td
                logger.info(f"🔄 Email {email_id} apertura #{log.open_count}")
            await db.commit()
        else:
            logger.warning(f"❌ Email log {email_id} no encontrado")
    except Exception as e:
        logger.error(f"💥 Error tracking email {email_id}: {str(e)}")
        try:
            await db.rollback()
        except:
            pass
    return Response(
        content=transparent_gif,
        media_type="image/gif",
        status_code=200,
        headers={"Cache-Control": "no-cache"}
    )

@router.post("/send")
async def send_email(
    email_data: EmailSend,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    logger.info(f"📨 Nueva solicitud de email desde: {current_user.username}")
    if not email_data.subject.strip():
        raise HTTPException(status_code=400, detail="El asunto es obligatorio")
    if not email_data.body.strip() and not email_data.html_body:
        raise HTTPException(status_code=400, detail="El cuerpo del email es obligatorio")
    if email_data.mailbox_id:
        result = await db.execute(
            select(Mailbox).where(
                Mailbox.id == email_data.mailbox_id,
                Mailbox.owner_id == current_user.id
            )
        )
        mailbox = result.scalar_one_or_none()
    else:
        result = await db.execute(
            select(Mailbox).where(
                Mailbox.owner_id == current_user.id,
                Mailbox.is_verified == True
            ).limit(1)
        )
        mailbox = result.scalars().first()
    if not mailbox:
        raise HTTPException(
            status_code=400, 
            detail="No hay buzones disponibles o verificados"
        )
    if email_data.html_body:
        email_data.html_body = email_data.html_body.strip()
    logger.info(f"📫 Usando mailbox: {mailbox.email} ({mailbox.provider})")
    background_tasks.add_task(
        send_email_background,
        email_data.to,
        email_data.subject,
        email_data.body,
        mailbox,
        current_user.id,
        db,
        email_data.html_body,
        email_data.cc,
        email_data.bcc,
        email_data.attachments
    )
    return {
        "success": True,
        "message": "Email agregado a cola de procesamiento",
        "mailbox_used": mailbox.email
    }

@router.get("/debug/tracking/{email_id}")
async def debug_tracking(
    email_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(EmailLog).where(
            EmailLog.id == email_id,
            EmailLog.sent_by == current_user.id
        )
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Email no encontrado")
    pixel_url = f"{BASE_URL}/emails/track/open/{email_id}.png"
    return {
        "email_id": email_id,
        "status": log.status,
        "created_at": log.created_at,
        "opened_at": log.opened_at,
        "pixel_url": pixel_url,
        "base_url": BASE_URL,
        "has_tracking": log.opened_at is not None,
        "open_count": log.open_count,
        "last_opened_at": log.last_opened_at,
        "tracking_data": log.tracking_data
    }

@router.get("/history", response_model=List[EmailResponse])
async def get_email_history(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        query = select(EmailLog).where(EmailLog.sent_by == current_user.id)
        if status:
            query = query.where(EmailLog.status == status)
        query = query.order_by(EmailLog.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(query)
        emails = result.scalars().all()
        return [
            EmailResponse(
                id=e.id,
                to_email=e.to_email,
                from_email=e.from_email,
                subject=e.subject,
                status=e.status,
                created_at=e.created_at.isoformat(),
                error_message=e.error_message,
                mailbox_id=e.mailbox_id,
                opened_at=e.opened_at.isoformat() if e.opened_at else None,
                open_count=e.open_count,
                last_opened_at=e.last_opened_at.isoformat() if e.last_opened_at else None,
                tracking_data=e.tracking_data
            ) for e in emails
        ]
    except Exception as e:
        logger.error(f"Error en get_email_history: {str(e)}")
        return []

@router.get("/stats", response_model=EmailStats)
async def get_email_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    try:
        sent_result = await db.execute(
            select(EmailLog).where(
                EmailLog.sent_by == current_user.id,
                EmailLog.status == 'sent'
            )
        )
        total_sent = len(sent_result.scalars().all())
        failed_result = await db.execute(
            select(EmailLog).where(
                EmailLog.sent_by == current_user.id,
                EmailLog.status == 'failed'
            )
        )
        total_failed = len(failed_result.scalars().all())
        yesterday = datetime.now() - timedelta(days=1)
        last_24h_result = await db.execute(
            select(EmailLog).where(
                EmailLog.sent_by == current_user.id,
                EmailLog.status == 'sent',
                EmailLog.created_at >= yesterday
            )
        )
        last_24h = len(last_24h_result.scalars().all())
        total_emails = total_sent + total_failed
        success_rate = (total_sent / total_emails * 100) if total_emails > 0 else 0
        return EmailStats(
            total_sent=total_sent,
            total_failed=total_failed,
            success_rate=round(success_rate, 2),
            last_24h=last_24h
        )
    except Exception as e:
        logger.error(f"Error en get_email_stats: {str(e)}")
        return EmailStats(
            total_sent=0,
            total_failed=0,
            success_rate=0,
            last_24h=0
        )

@router.delete("/history/{email_id}")
async def delete_email_log(
    email_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(
        select(EmailLog).where(
            EmailLog.id == email_id,
            EmailLog.sent_by == current_user.id
        )
    )
    email_log = result.scalar_one_or_none()
    if not email_log:
        raise HTTPException(status_code=404, detail="Email no encontrado")
    await db.delete(email_log)
    await db.commit()
    return {"success": True, "message": "Log eliminado"}

async def check_rate_limit(user_id: int, db: AsyncSession, limit: int = 100):
    one_hour_ago = datetime.now() - timedelta(hours=1)
    result = await db.execute(
        select(EmailLog).where(
            EmailLog.sent_by == user_id,
            EmailLog.created_at >= one_hour_ago
        )
    )
    recent_emails = result.scalars().all()
    if len(recent_emails) >= limit:
        raise HTTPException(
            status_code=429, 
            detail=f"Límite de {limit} emails por hora excedido"
        )
