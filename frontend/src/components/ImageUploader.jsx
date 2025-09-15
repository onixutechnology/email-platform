import React, { useState } from "react";

function ImageUploader({ onUpload }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://email-platform-api-j0fg.onrender.com/upload-image/", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    // Retorna la URL pública de la imagen subida
    onUpload(`https://email-platform-api-j0fg.onrender.com${data.url}`);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {preview && <img src={preview} alt="Previsualización" style={{ maxWidth: 200, marginTop: 10 }} />}
    </div>
  );
}

export default ImageUploader;
