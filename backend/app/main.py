from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import domains, emails, auth, user, mailbox, files
from app.db.base import engine, Base
from app.core.database import connect_to_mongo, close_mongo_connection

# ✅ IMPORTAR TODOS LOS MODELOS (incluyendo EmailLog)
from app.models.user import User
from app.models.role import Role
from app.models.user_roles import user_roles
from app.models.mailbox import Mailbox
from app.models.outgoing_domain import OutgoingDomain
from app.models.email_log import EmailLog  # ← AGREGAR ESTA LÍNEA

app = FastAPI(
    title="Email Platform API",
    description="API para plataforma de gestión de correo electrónico",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://email-platform-na5m.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Archivos estáticos
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# ✅ Registrar routers (el orden importa)
app.include_router(files.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(mailbox.router)
app.include_router(domains.router)
app.include_router(emails.router)  # ← Aquí está el tracking

@app.get("/")
def root():
    return {"service": "Email Platform API", "status": "online", "tracking": "enabled"}

@app.on_event("startup")
async def startup_event():
    try:
        await connect_to_mongo()
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas/verificadas exitosamente y MongoDB conectado!")
        
        # ✅ MOSTRAR TODAS LAS RUTAS REGISTRADAS
        print("📋 Rutas registradas:")
        for route in app.routes:
            if hasattr(route, 'path'):
                print(f"   {route.methods} {route.path}")
                
    except Exception as e:
        print(f"❌ Error durante el startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    print("🔒 Conexión MongoDB cerrada.")
