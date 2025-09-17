from pydantic_settings import BaseSettings
from pydantic import ConfigDict


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

    # Proveedores de mail (puedes completar en .env)
    AWS_SES_ACCESS_KEY: str = ""
    AWS_SES_SECRET_KEY: str = ""
    AWS_SES_REGION: str = "us-east-1"
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""

    # Puerto para desplegar la app (por ejemplo, en Render)
    PORT: int = 8000

    # Configuración para cargar variables de entorno desde un archivo .env
    model_config = ConfigDict(env_file=".env")
  # ✅ AGREGAR ESTA LÍNEA:
    email_platform_api_url: str = "http://localhost:8000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False  # Para convertir EMAIL_PLATFORM_API_URL → email_platform_api_url


settings = Settings()
