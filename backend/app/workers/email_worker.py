from email.message import EmailMessage
import asyncio
import aiosmtplib
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "email_worker",
    broker="redis://localhost:6379/0",
)

@celery_app.task
def send_email_task(recipient: str, subject: str, body: str, sender: str):
    loop = asyncio.get_event_loop()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient
    msg.set_content("Este correo requiere un cliente compatible con HTML.")  # Texto plano alternativo
    msg.add_alternative(body, subtype="html")  # Aquí va el HTML!

    loop.run_until_complete(aiosmtplib.send(
        msg,
        hostname="smtp.mailgun.org",
        port=587,
        username=sender,
        password="MAIL_PASSWORD"
    ))
    return True
