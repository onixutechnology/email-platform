from decouple import config
import motor.motor_asyncio
from typing import Optional

class DatabaseConnection:
    client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
    db = None

database = DatabaseConnection()

async def connect_to_mongo():
    MONGO_URI = config("MONGO_URI")
    database.client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    database.db = database.client["produccionep"]  # Cambia por tu base
    print("✅ Conectado a MongoDB")

async def close_mongo_connection():
    if database.client:
        database.client.close()
        print("❌ Conexión MongoDB cerrada")

def get_database():
    return database.db
