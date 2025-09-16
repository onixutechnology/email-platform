import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageGallery from "./ImageGallery";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import EmojiPicker from "emoji-picker-react";

// Plugins visuales y resize
import ImageResize from "quill-image-resize-module-react";
Quill.register("modules/imageResize", ImageResize);

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }, { font: [] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    [{ direction: "rtl" }],
    ["link", "image", "video", "emoji"], // soporte emoji, video
    ["clean"]
  ],
  imageResize: { modules: ["Resize", "DisplaySize", "Toolbar"] }
};
const quillFormats = [
  "header","font","size","bold","italic","underline","strike","blockquote",
  "color","background","align","script","direction","list","indent",
  "link","image","video","emoji"
];

// Función de crop real
function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, croppedAreaPixels.width, croppedAreaPixels.height
      );
      canvas.toBlob(blob => {
        resolve(blob);
      }, "image/png");
    };
  });
}

// Crop Modal ultra completo
function CropModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 10, minWidth: 350, boxShadow: "0 2px 12px #0003" }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={4/3}
          showGrid={true}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
        />
        <div style={{ margin: "18px 0 12px 0"}}>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, z) => setZoom(z)}
          />
        </div>
        <button onClick={async () => {
          const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
          onComplete(blob);
        }} className="bg-indigo-600 text-white px-4 py-2 rounded mr-2">Recortar y Subir</button>
        <button onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
      </div>
    </div>
  );
}

// Uploader ultra completo con crop, extensiones y drag&drop
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
      return alert("Solo imágenes jpg/jpeg/png/gif/webp permitidas.");
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    setLoading(true);
    setShowCrop(false);
    const formData = new FormData();
    formData.append("file", new File([croppedBlob], "cropped-image.png", { type: croppedBlob.type }));

    try {
      const response = await fetch("https://email-platform-api-j0fg.onrender.com/upload-image/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const url = `https://email-platform-api-j0fg.onrender.com${data.url}`;
      onUploaded(url);
    } catch (err) {
      alert("Error al subir imagen");
    }
    setLoading(false);
    setImageSrc(null);
  };

  // Soporte de arrastre y soltado
  const handleDrop = (e) => {
    e.preventDefault();
    if(e.dataTransfer.files.length) handleFileChange({ target: { files: e.dataTransfer.files } });
  };

  return (
    <div style={{ marginBottom: "16px" }} onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      <label className="block text-sm font-medium text-gray-700">
        Adjuntar imagen (crop, drag&drop, extensiones seguras)
      </label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} style={{ marginBottom: 5 }}/>
      <span style={{ fontSize: 12, color: "#999" }}>Arrastra una imagen aquí para subir</span>
      {loading && <span className="text-xs text-gray-500 ml-2">Subiendo...</span>}
      {showCrop && imageSrc &&
        <CropModal
          imageSrc={imageSrc}
          onComplete={handleCropComplete}
          onCancel={() => setShowCrop(false)}
        />
      }
    </div>
  );
}

const EmailCompose = () => {
  const [formData, setFormData] = useState({ to: '', subject: '', body: '', mailbox_id: '' });
  const [mailboxes, setMailboxes] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const quillRef = useRef(null);

  useEffect(() => {
    const fetchMailboxes = async () => {
      try {
        const response = await api.get('/mailboxes');
        setMailboxes(response.data);
      } catch (error) {
        setStatus('Error cargando buzones');
      }
    };
    fetchMailboxes();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleQuillChange = (content) => setFormData(prev => ({ ...prev, body: content }));
  const insertImageInQuill = (imageUrl) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertEmbed(range ? range.index : 0, "image", imageUrl);
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML,
    }));
  };

  // Insertar emoji en el editor Quill
  const handleEmoji = (emojiObj) => {
    const editor = quillRef.current.getEditor();
    editor.insertText(editor.getLength()-1, emojiObj.emoji, "user");
    setShowEmoji(false);
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML,
    }));
  };

  const handleImageUploaded = (imageUrl) => {
    insertImageInQuill(imageUrl);
    setGalleryRefresh(val => val + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setStatus('');
    try {
      const emailData = {
        to: formData.to, subject: formData.subject, body: 'Este correo requiere visualizar HTML.', html_body: formData.body,
      };
      if (formData.mailbox_id && formData.mailbox_id !== '') {
        emailData.mailbox_id = parseInt(formData.mailbox_id);
      }
      await api.post('/emails/send', emailData);
      setStatus('¡Correo enviado exitosamente!');
      setFormData({ to: '', subject: '', body: '', mailbox_id: '' });
      quillRef.current.getEditor().setContents([]);
    } catch (error) {
      setStatus('Error al enviar correo: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Redactar Correo Ultra Completo
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Buzón de envío</label>
            <select
              name="mailbox_id"
              value={formData.mailbox_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Seleccionar buzón...</option>
              {mailboxes.map(mailbox => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name} ({mailbox.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destinatario</label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="destinatario@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asunto</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              placeholder="Asunto del correo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mensaje HTML pro: crop, galería avanzada, drag&drop, emoji, búsqueda, etc.
            </label>
            <ImageUploader onUploaded={handleImageUploaded} />
            <input
              type="text"
              placeholder="Buscar imagen en galería..."
              value={galleryFilter}
              onChange={e => setGalleryFilter(e.target.value)}
              style={{ marginBottom: 7, width: "60%" }}
            />
            <ImageGallery
              onSelect={insertImageInQuill}
              refreshTrigger={galleryRefresh}
              filter={galleryFilter}
            />
            <button type="button" onClick={() => setShowEmoji(val => !val)} className="bg-yellow-200 px-2 py-1 rounded text-sm mb-2">🙂 Emoji</button>
            {showEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.body}
              onChange={handleQuillChange}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white"
              style={{ minHeight: "260px" }}
            />
          </div>
          <div className="mt-4 mb-2 p-3 border rounded bg-gray-50">
            <label className="block text-xs font-bold text-gray-400 mb-1">Vista previa mensaje HTML:</label>
            <div dangerouslySetInnerHTML={{ __html: formData.body }} style={{ fontSize: 16 }} />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Correo'}
            </button>
          </div>
          {status && (
            <div className={`p-3 rounded ${
              status.includes("Error")
                ? "bg-red-100 border border-red-400 text-red-700"
                : "bg-green-100 border border-green-400 text-green-700"
            }`}>
              {status}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
export default EmailCompose;
