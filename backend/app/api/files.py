from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
import os
import shutil

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "url": f"/static/{file.filename}"}

@router.get("/gallery/")
async def gallery():
    # Solo muestra imágenes válidas por extensión
    exts = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}
    files = [
        {"filename": f, "url": f"/static/{f}"}
        for f in os.listdir(UPLOAD_DIR)
        if os.path.splitext(f)[-1].lower() in exts
    ]
    return JSONResponse(files)
