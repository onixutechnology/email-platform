import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import smtplib
import ssl
import json
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import boto3
from botocore.exceptions import ClientError
import requests
from datetime import datetime, timedelta

from app.db.base import get_db
from app.models.email_log import EmailLog
from app.models.mailbox import Mailbox
from app.auth.auth import get_current_active_user
from app.models.user import User

from fastapi import Request, Response
from sqlalchemy import update
from datetime import datetime
from app.core.config import settings

BASE_URL = settings.EMAIL_PLATFORM_API_URL

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/emails", tags=["emails"])

def add_tracking_pixel(html_body: str, email_log_id: int) -> str:
    """Agrega pixel de tracking al HTML"""
    if html_body:
        pixel_url = f"{BASE_URL}/track/open/{email_log_id}.png"
        tracking_pixel = f'<img src="{pixel_url}" width="1" height="1" style="display:none;" />'
        
        # ✅ AGREGAR ESTE LOG
        logger.info(f"🔍 Agregando pixel de tracking: {pixel_url}")
        
        if "</body>" in html_body:
            html_body = html_body.replace("</body>", f"{tracking_pixel}</body>")
        else:
            html_body += tracking_pixel
            
        # ✅ AGREGAR ESTE LOG
        logger.info(f"✅ Pixel agregado correctamente")
    else:
        # ✅ AGREGAR ESTE LOG
        logger.warning(f"⚠️ No hay HTML body para agregar pixel al email {email_log_id}")
    
    return html_body


# Modelos Pydantic
class EmailSend(BaseModel):
    to: EmailStr
    subject: str
    body: str
    html_body: Optional[str] = None
    mailbox_id: Optional[int] = None
    cc: Optional[List[EmailStr]] = None
    bcc: Optional[List[EmailStr]] = None
    attachments: Optional[List[str]] = None  # ← AGREGAR ESTA LÍNEA
 

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

class EmailStats(BaseModel):
    total_sent: int
    total_failed: int
    success_rate: float
    last_24h: int

# Configuraciones por proveedor
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
    """Clase para manejar envío de emails por diferentes proveedores"""
    
    @staticmethod
    async def send_via_smtp(mailbox: Mailbox, to_email: str, subject: str, 
                           body: str, html_body: Optional[str] = None,
                           cc: Optional[List[str]] = None, 
                           bcc: Optional[List[str]] = None,
                           attachments: Optional[List[str]] = None) -> Dict[str, Any]:  # ← AGREGAR ESTE PARÁMETRO
        """Envía email vía SMTP (Gmail, Outlook, etc.)"""
        try:
            settings = json.loads(mailbox.settings)
            
            # ✅ CORRECCIÓN: Convertir proveedor a minúsculas
            provider_lower = mailbox.provider.lower()
            
            # Configuración SMTP
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
            logger.info(f"🔄 Enviando desde: {mailbox.email}")  # marketing@onixu.com

            # Crear mensaje
            from_name = mailbox.name or "Marketing ONIXU"
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{from_name} <{mailbox.email}>"  # "Marketin
            msg['To'] = to_email
            msg['Subject'] = subject

            msg['Reply-To'] = mailbox.email

            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)

            

                    # ← AGREGAR AQUÍ - Soporte para adjuntos
            if attachments:
             for file_path in attachments:

                if os.path.exists(file_path):
                    with open(file_path, "rb") as attachment:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(attachment.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {os.path.basename(file_path)}'
                        )
                        msg.attach(part)


            # Agregar cuerpo de texto plano
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Agregar HTML si está disponible
            if html_body:
                msg.attach(MIMEText(html_body, 'html', 'utf-8'))
            
            # Conectar y enviar
            server = smtplib.SMTP(smtp_host, smtp_port)


            if use_tls:
                server.starttls()
            
            server.login(username, password)


            
            # Preparar lista de destinatarios
            recipients = [to_email]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)
            
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
    async def send_via_ses(mailbox: Mailbox, to_email: str, subject: str, 
                          body: str, html_body: Optional[str] = None) -> Dict[str, Any]:
        """Envía email vía Amazon SES"""
        try:
            settings = json.loads(mailbox.settings)
            
            aws_access_key = settings.get('access_key_id')
            aws_secret_key = settings.get('secret_access_key')
            region = settings.get('region', 'us-east-1')
            
            if not all([aws_access_key, aws_secret_key]):
                raise Exception("Credenciales AWS SES incompletas")
            
            # Cliente SES
            ses_client = boto3.client(
                'ses',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=region
            )
            
            # Preparar mensaje
            destination = {'ToAddresses': [to_email]}
            
            message = {
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {}
            }
            
            if html_body:
                message['Body']['Html'] = {'Data': html_body, 'Charset': 'UTF-8'}
            else:
                message['Body']['Text'] = {'Data': body, 'Charset': 'UTF-8'}
            
            # Enviar
            response = ses_client.send_email(
                Source=mailbox.email,
                Destination=destination,
                Message=message
            )
            
            logger.info(f"✅ Email SES enviado: {response['MessageId']}")
            return {"success": True, "message_id": response['MessageId']}
            
        except ClientError as e:
            error_msg = f"Error AWS SES: {e.response['Error']['Message']}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
            
        except Exception as e:
            error_msg = f"Error SES: {str(e)}"
            logger.error(f"❌ {error_msg}")
            return {"success": False, "error": error_msg}
    
    @staticmethod
    async def send_via_mailgun(mailbox: Mailbox, to_email: str, subject: str, 
                              body: str, html_body: Optional[str] = None) -> Dict[str, Any]:
        """Envía email vía Mailgun"""
        try:
            settings = json.loads(mailbox.settings)
            
            api_key = settings.get('api_key')
            domain = settings.get('domain')
            base_url = settings.get('base_url', 'https://api.mailgun.net/v3')
            
            if not all([api_key, domain]):
                raise Exception("Configuración Mailgun incompleta")
            
            url = f"{base_url}/{domain}/messages"
            
            data = {
                'from': mailbox.email,
                'to': to_email,
                'subject': subject,
                'text': body
            }
            
            if html_body:
                data['html'] = html_body
            
            response = requests.post(
                url,
                auth=('api', api_key),
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Email Mailgun enviado: {result.get('id')}")
                return {"success": True, "message_id": result.get('id')}
            else:
                error_msg = f"Error Mailgun: {response.status_code} - {response.text}"
                logger.error(f"❌ {error_msg}")
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            error_msg = f"Error Mailgun: {str(e)}"
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
    """Función para enviar email en background con reintentos"""
    
    # ✅ PRIMERO: Crear log inicial
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
    await db.refresh(email_log)   # ← ¡ESTO ES CRUCIAL para obtener el id real de la BD!
    
    # ✅ SEGUNDO: Agregar pixel de tracking si hay HTML
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
        
        # Verificar que el mailbox esté verificado
        if not mailbox.is_verified:
            logger.warning(f"⚠️ Mailbox {mailbox.email} no está verificado")
        
        # Enviar según proveedor
        sender = EmailSender()
        provider_lower = mailbox.provider.lower()
        
        if provider_lower in ['gmail', 'outlook', 'yahoo', 'smtp']:
            result = await sender.send_via_smtp(
                mailbox, to_email, subject, body, html_body, cc, bcc, attachments
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
        
        # Reintentar hasta 3 veces
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
    
    # Guardar en base de datos
    db.add(email_log)
    await db.commit()
    logger.info(f"💾 Log guardado con status: {email_log.status}")



# Endpoints
@router.get("/track/open/{email_id}.png")
async def track_email_open(
    email_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Registrar apertura de email y devolver pixel transparente"""
    
    # ✅ AGREGAR LOGGING
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "Unknown")
    logger.info(f"📬 TRACKING: Email {email_id} abierto desde IP {client_ip}")
    logger.info(f"📱 User-Agent: {user_agent}")
    
    # Buscar log
    result = await db.execute(
        select(EmailLog).where(EmailLog.id == email_id)
    )
    log = result.scalar_one_or_none()
    
    if not log:
        logger.warning(f"❌ Email log {email_id} no encontrado")
    elif log.opened_at:
        logger.info(f"ℹ️ Email {email_id} ya había sido abierto anteriormente")
    else:
        log.opened_at = datetime.utcnow()
        await db.commit()
        logger.info(f"✅ Email {email_id} marcado como abierto por primera vez")
    
    # Devolver pixel transparente
    transparent_gif = (
        b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff'
        b'\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,'
        b'\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x04\x01\x00;'
    )
    return Response(content=transparent_gif, media_type="image/gif")


@router.post("/send")
async def send_email(
    email_data: EmailSend,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enviar email"""
    logger.info(f"📨 Nueva solicitud de email desde: {current_user.username}")
    
    # Validaciones
    if not email_data.subject.strip():
        raise HTTPException(status_code=400, detail="El asunto es obligatorio")
    
    if not email_data.body.strip() and not email_data.html_body:
        raise HTTPException(status_code=400, detail="El cuerpo del email es obligatorio")
    
    # Obtener mailbox
    if email_data.mailbox_id:
        result = await db.execute(
            select(Mailbox).where(
                Mailbox.id == email_data.mailbox_id,
                Mailbox.owner_id == current_user.id  # Solo propios buzones
            )
        )
        mailbox = result.scalar_one_or_none()
    else:
        # Usar primer mailbox verificado
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
    
    # Validación HTML
    if email_data.html_body:
      email_data.html_body = email_data.html_body.strip()
    # Opcional: agregar tracking pixel
    # email_data.html_body = add_tracking_pixel(email_data.html_body, future_log_id)




    logger.info(f"📫 Usando mailbox: {mailbox.email} ({mailbox.provider})")
    
    # Rate limiting básico (opcional)
    # await check_rate_limit(current_user.id, db)
    
    # Enviar en background
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
        email_data.attachments  # ← AGREGAR ESTA LÍNEA

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
    """Debug del tracking de un email específico"""
    
    result = await db.execute(
        select(EmailLog).where(
            EmailLog.id == email_id,
            EmailLog.sent_by == current_user.id
        )
    )
    log = result.scalar_one_or_none()
    
    if not log:
        raise HTTPException(status_code=404, detail="Email no encontrado")
    
    pixel_url = f"{BASE_URL}/track/open/{email_id}.png"
    
    return {
        "email_id": email_id,
        "status": log.status,
        "created_at": log.created_at,
        "opened_at": log.opened_at,
        "pixel_url": pixel_url,
        "base_url": BASE_URL,
        "has_tracking": log.opened_at is not None
    }


@router.get("/history", response_model=List[EmailResponse])
async def get_email_history(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obtener historial de emails"""
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
            opened_at=e.opened_at.isoformat() if e.opened_at else None
        ) for e in emails
    ]

@router.get("/stats", response_model=EmailStats)
async def get_email_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Estadísticas de emails"""
    
    # Total enviados
    sent_result = await db.execute(
        select(EmailLog).where(
            EmailLog.sent_by == current_user.id,
            EmailLog.status == 'sent'
        )
    )
    total_sent = len(sent_result.scalars().all())
    
    # Total fallidos
    failed_result = await db.execute(
        select(EmailLog).where(
            EmailLog.sent_by == current_user.id,
            EmailLog.status == 'failed'
        )
    )
    total_failed = len(failed_result.scalars().all())
    
    # Últimas 24h
    yesterday = datetime.now() - timedelta(days=1)
    last_24h_result = await db.execute(
        select(EmailLog).where(
            EmailLog.sent_by == current_user.id,
            EmailLog.status == 'sent',
            EmailLog.created_at >= yesterday
        )
    )
    last_24h = len(last_24h_result.scalars().all())
    
    # Tasa de éxito
    total_emails = total_sent + total_failed
    success_rate = (total_sent / total_emails * 100) if total_emails > 0 else 0
    
    return EmailStats(
        total_sent=total_sent,
        total_failed=total_failed,
        success_rate=round(success_rate, 2),
        last_24h=last_24h
    )

@router.delete("/history/{email_id}")
async def delete_email_log(
    email_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Eliminar log de email"""
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

# Funciones auxiliares
async def check_rate_limit(user_id: int, db: AsyncSession, limit: int = 100):
    """Verificar límite de emails por hora"""
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
