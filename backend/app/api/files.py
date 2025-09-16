from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from fastapi.responses import JSONResponse
import os
import shutil

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Extensiones permitidas para imágenes y adjuntos
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}
ADJUNTO_EXTS = {".pdf", ".docx", ".xlsx", ".pptx"}
ALLOWED_EXTS = IMAGE_EXTS.union(ADJUNTO_EXTS)

@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    filename = file.filename
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Extensión '{ext}' no permitida")
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": filename, "url": f"/static/{filename}"}

@router.get("/gallery/")
async def gallery(
    search: str = Query("", description="Buscar por nombre/tag"),
    only_images: bool = Query(True, description="Mostrar solo imágenes")
):
    if only_images:
        exts = IMAGE_EXTS
    else:
        exts = ALLOWED_EXTS
    files = [
        {"filename": f, "url": f"/static/{f}"}
        for f in os.listdir(UPLOAD_DIR)
        if os.path.splitext(f)[-1].lower() in exts and search.lower() in f.lower()
    ]
    return JSONResponse(files)
