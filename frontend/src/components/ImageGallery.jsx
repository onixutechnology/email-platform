import React, { useEffect, useState } from "react";

function ImageGallery({ onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://email-platform-api-j0fg.onrender.com/gallery/");
        const data = await response.json();
        setImages(data);
      } catch (err) {
        setImages([]);
      }
      setLoading(false);
    };
    fetchGallery();
  }, []);

  return (
    <div style={{ marginBottom: "16px" }}>
      <label className="block text-sm font-medium text-gray-700 mb-2">Galería de Imágenes</label>
      {loading && <span>Cargando imágenes...</span>}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        border: "1px solid #eee",
        padding: "8px",
        background: "#fafafa"
      }}>
        {images.length === 0 && !loading && <span>No hay imágenes subidas aún.</span>}
        {images.map(img => (
          <div key={img.filename} style={{ textAlign: "center" }}>
            <img
              src={`https://email-platform-api-j0fg.onrender.com${img.url}`}
              alt={img.filename}
              style={{
                width: 80,
                height: 80,
                objectFit: "cover",
                cursor: "pointer",
                borderRadius: 6,
                border: "1px solid #ddd",
                boxShadow: "1px 1px 3px #eee"
              }}
              onClick={() => onSelect(`https://email-platform-api-j0fg.onrender.com${img.url}`)}
              title="Insertar imagen"
            />
            <div style={{ fontSize: 10, marginTop: 2 }}>{img.filename}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageGallery;
