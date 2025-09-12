import asyncio
import sys
import os
from pathlib import Path
from app.models.outgoing_domain import OutgoingDomain
from app.models.email_log import EmailLog

# Agregar la ruta del backend al path para importar módulos
backend_path = Path(__file__).parent
sys.path.insert(0,str(backend_path))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings
from app.db.base import Base, AsyncSessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.mailbox import Mailbox
from app.models.message import Message
from app.models.user_roles import user_roles
from app.auth.auth import get_password_hash

async def create_database_if_not_exists():
    """Crear la base de datos si no existe"""
    db_url_parts = settings.DATABASE_URL.split("/")
    db_name = db_url_parts[-1]
    base_url = "/".join(db_url_parts[:-1]) + "/postgres"
    engine = create_async_engine(base_url, echo=False)

    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
            {"db_name": db_name}
        )
        if not result.fetchone():
            print(f"Creating database: {db_name}")
            await conn.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"✅ Database '{db_name}' created successfully")
        else:
            print(f"✅ Database '{db_name}' already exists")
    await engine.dispose()

async def create_tables():
    """Crear todas las tablas del modelo"""
    print("Creating database tables...")
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print("✅ All tables created successfully")

async def create_initial_roles():
    """Crear roles básicos del sistema"""
    print("Creating initial roles...")
    roles_data = [
        {"name": "admin", "description": "Administrador del sistema"},
        {"name": "contador", "description": "Rol para personal contable"},
        {"name": "admon", "description": "Rol para personal administrativo"},
        {"name": "mkt", "description": "Rol para personal de marketing"},
        {"name": "usuario", "description": "Usuario básico del sistema"},
    ]
    async with AsyncSessionLocal() as db:
        try:
            for role_data in roles_data:
                existing_role = await db.execute(
                    text("SELECT id FROM roles WHERE name = :name"),
                    {"name": role_data["name"]}
                )
                if not existing_role.fetchone():
                    role = Role(**role_data)
                    db.add(role)
                    print(f"  ➕ Created role: {role_data['name']}")
                else:
                    print(f"  ✅ Role already exists: {role_data['name']}")
            await db.commit()
            print("✅ Initial roles created successfully")
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating roles: {e}")
            raise

async def create_admin_user():
    """Crear usuario administrador inicial"""
    print("Creating admin user...")
    admin_data = {
        "username": "admin",
        "email": "admin@emailplatform.com",
        "full_name": "Administrador del Sistema",
        "password": "admin123"  # Cambiar en producción
    }
    async with AsyncSessionLocal() as db:
        try:
            existing_user = await db.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": admin_data["username"]}
            )
            if existing_user.fetchone():
                print("  ✅ Admin user already exists")
                return
            hashed_password = get_password_hash(admin_data["password"])
            admin_user = User(
                username=admin_data["username"],
                email=admin_data["email"],
                full_name=admin_data["full_name"],
                hashed_password=hashed_password,
                is_active=True
            )
            db.add(admin_user)
            await db.flush()
            admin_role = await db.execute(
                text("SELECT id FROM roles WHERE name = 'admin'")
            )
            admin_role_id = admin_role.fetchone()[0]
            await db.execute(
                text("INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"),
                {"user_id": admin_user.id, "role_id": admin_role_id}
            )
            await db.commit()
            print(f"✅ Admin user created: {admin_data['username']}")
            print(f"   📧 Email: {admin_data['email']}")
            print(f"   🔑 Password: {admin_data['password']}")
            print("   ⚠️  IMPORTANT: Change the admin password after first login!")
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating admin user: {e}")
            raise

async def create_sample_mailboxes():
    """Crear buzones de ejemplo para cada departamento"""
    print("Creating sample mailboxes...")
    mailboxes_data = [
        {
            "name": "Contabilidad",
            "email": "contabilidad@empresa.com",
            "provider": "gmail",
            "auth_type": "oauth2",
            "settings": '{"department": "contabilidad"}'
        },
        {
            "name": "Administración",
            "email": "admin@empresa.com",
            "provider": "ses",
            "auth_type": "smtp",
            "settings": '{"department": "administracion"}'
        },
        {
            "name": "Marketing",
            "email": "marketing@empresa.com",
            "provider": "mailgun",
            "auth_type": "smtp",
            "settings": '{"department": "marketing"}'
        }
    ]
    async with AsyncSessionLocal() as db:
        try:
            admin_user = await db.execute(
                text("SELECT id FROM users WHERE username = 'admin'")
            )
            admin_user_id = admin_user.fetchone()
            if not admin_user_id:
                print("  ⚠️  Admin user not found, skipping mailbox creation")
                return
            admin_user_id = admin_user_id[0]
            for mailbox_data in mailboxes_data:
                existing_mailbox = await db.execute(
                    text("SELECT id FROM mailboxes WHERE email = :email"),
                    {"email": mailbox_data["email"]}
                )
                if not existing_mailbox.fetchone():
                    mailbox = Mailbox(
                        **mailbox_data,
                        owner_id=admin_user_id,   # Cambia a 'owner_id' si ese es el nombre real en tu modelo
                        is_verified=False
                    )
                    db.add(mailbox)
                    print(f"  ➕ Created mailbox: {mailbox_data['name']}")
                else:
                    print(f"  ✅ Mailbox already exists: {mailbox_data['name']}")
            await db.commit()
            print("✅ Sample mailboxes created successfully")
        except Exception as e:
            await db.rollback()
            print(f"❌ Error creating sample mailboxes: {e}")
            raise

async def verify_installation():
    """Verificar que la instalación sea correcta"""
    print("\n🔍 Verifying installation...")
    async with AsyncSessionLocal() as db:
        try:
            users_count = await db.execute(text("SELECT COUNT(*) FROM users"))
            users_count = users_count.fetchone()[0]
            roles_count = await db.execute(text("SELECT COUNT(*) FROM roles"))
            roles_count = roles_count.fetchone()[0]
            mailboxes_count = await db.execute(text("SELECT COUNT(*) FROM mailboxes"))
            mailboxes_count = mailboxes_count.fetchone()[0]
            print(f"  👥 Users: {users_count}")
            print(f"  🏷️  Roles: {roles_count}")
            print(f"  📧 Mailboxes: {mailboxes_count}")
            print("✅ Installation verification completed")
        except Exception as e:
            print(f"❌ Error during verification: {e}")

async def main():
    print("🚀 Starting database initialization...")
    print(f"📍 Database URL: {settings.DATABASE_URL}")
    print("=" * 50)
    try:
        await create_database_if_not_exists()
        await create_tables()
        await create_initial_roles()
        await create_admin_user()
        await create_sample_mailboxes()
        await verify_installation()
        print("\n" + "=" * 50)
        print("🎉 Database initialization completed successfully!")
        print("=" * 50)
    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
