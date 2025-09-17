from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Información general
    PROJECT_NAME: str = "Email Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Conexiones a bases de datos
    DATABASE_URL: str = "postgresql+asyncpg://fastapiuser:superadmin99@localhost:5433/emailplatform"
    MONGO_URI: str = "mongodb://localhost:27017"

    # Configuración de seguridad
    SECRET_KEY: str = "change-this-to-a-secure-random-key-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # Proveedores de mail
    AWS_SES_ACCESS_KEY: str = ""
    AWS_SES_SECRET_KEY: str = ""
    AWS_SES_REGION: str = "us-east-1"
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""

    # Puerto para desplegar la app
    PORT: int = 8000
    
    # ✅ Variable para tracking de emails
    EMAIL_PLATFORM_API_URL: str = "http://localhost:8000"

    # ✅ Solo usar model_config (NO class Config)
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # Ignora variables extra de Render
    )

settings = Settings()
