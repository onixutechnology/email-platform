import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Cargar variables de entorno
load_dotenv()

async def create_tables():
    DATABASE_URL = os.getenv("DATABASE_URL")
    print(f"🔗 Conectando a: {DATABASE_URL}")
    
    # Crear engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    try:
        async with engine.begin() as conn:
            print("🔄 Creando tablas...")
            
            # Crear tabla users
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    full_name VARCHAR(100),
                    hashed_password VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Crear tabla roles
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS roles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
            # Crear tabla user_roles
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_roles (
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, role_id)
                )
            """))
            
            # Crear tabla mailboxes
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS mailboxes (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            
        print("✅ ¡Tablas creadas exitosamente!")
        
        # Verificar tablas
        async with engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]
            print(f"📋 Tablas en la base de datos: {tables}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_tables())
