from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import domains, emails, auth, user, mailbox, files
from app.db.base import engine, Base
from app.core.database import connect_to_mongo, close_mongo_connection

# Importar modelos (asegura migraciones y create_all)
from app.models.user import User
from app.models.role import Role
from app.models.user_roles import user_roles
from app.models.mailbox import Mailbox
from app.models.outgoing_domain import OutgoingDomain

# 1. Instancia FastAPI
app = FastAPI(
    title="Email Platform API",
    description="API para plataforma de gestión de correo electrónico",
    version="1.0.0"
)

# 2. Configurar CORS
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

# 3. Montar archivos estáticos (después de crear la app)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# 4. Registrar Routers
app.include_router(files.router)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(mailbox.router)
app.include_router(domains.router)
app.include_router(emails.router)

@app.get("/")
def root():
    return {"service": "Email Platform API", "status": "online"}

@app.on_event("startup")
async def startup_event():
    try:
        await connect_to_mongo()
        # INICIA LAS TABLAS TRAS importar todos los modelos
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas/verificadas exitosamente y MongoDB conectado!")
    except Exception as e:
        print(f"❌ Error durante el startup: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    print("🔒 Conexión MongoDB cerrada.")
