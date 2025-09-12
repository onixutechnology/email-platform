from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import domains, emails
from app.api import auth, user, mailbox
from app.db.base import engine, Base
from app.core.database import connect_to_mongo, close_mongo_connection


app = FastAPI(
    title="Email Platform API",
    description="API para plataforma de gestión de correo electrónico",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Tablas creadas/verificadas exitosamente y MongoDB conectado!")
    except Exception as e:
        print(f"❌ Error durante el startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()
    print("🔒 Conexión MongoDB cerrada.")
