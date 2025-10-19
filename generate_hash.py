from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Generar hash para admin
admin_hash = pwd_context.hash("adminep2025")
print("Hash admin:", admin_hash)

# Generar hash para marketing
marketing_hash = pwd_context.hash("marketingep2025")
print("Hash marketing:", marketing_hash)
