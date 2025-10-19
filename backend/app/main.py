from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import domains, emails, auth, user, mailbox, files
from app.db.base import engine, Base
from app.core.database import connect_to_mongo, close_mongo_connection

# Importar modelos
from app.models.user import User
from app.models.role import Role
from app.models.user_roles import user_roles
from app.models.mailbox import Mailbox
from app.models.outgoing_domain import OutgoingDomain
from app.models.email_log import EmailLog

app = FastAPI(
    title="Email Platform API",
    description="API para plataforma de gestión de correo electrónico",
    version="1.0.0"
)

# CORS CONFIGURADO SOLO PARA FRONTEND DE PRODUCCIÓN
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://email-platform-na5m.onrender.com"],  # Solo frontend autorizado
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)
print("CORS origins permitidos:", ["https://email-platform-na5m.onrender.com"])

# Archivos estáticos DESPUÉS de CORS
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Registrar routers
app.include_router(files.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(mailbox.router)
app.include_router(domains.router)
app.include_router(emails.router)

@app.get("/")
def root():
    return {
        "service": "Email Platform API", 
        "status": "online", 
        "cors": "enabled"
    }

@app.on_event("startup")
async def startup_event():
    try:
        await connect_to_mongo()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas/verificadas exitosamente y MongoDB conectado!")
        print("📬 Sistema de tracking de emails activado")
        print("🌐 CORS configurado explícitamente para frontend de producción")
    except Exception as e:
        print(f"❌ Error durante el startup: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    print("🔒 Conexión MongoDB cerrada.")
