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
    ["link", "image", "video", "emoji"],
    ["clean"]
  ],
  imageResize: { modules: ["Resize", "DisplaySize", "Toolbar"] }
};

const quillFormats = [
  "header","font","size","bold","italic","underline","strike","blockquote",
  "color","background","align","script","direction","list","indent",
  "link","image","video","emoji"
];

// ✅ Función mejorada para obtener imagen recortada
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
      }, "image/png", 0.9);
    };
  });
}

// ✅ Modal de recorte MEJORADO con botones visibles y funcionales
function CropModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCropComplete = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onComplete(blob);
    } catch (error) {
      console.error("Error al recortar imagen:", error);
      alert("Error al procesar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        width: "90%",
        maxWidth: "600px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        overflow: "hidden"
      }}>
        
        {/* Header del modal */}
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: "18px", 
            fontWeight: "600", 
            color: "#1f2937" 
          }}>
            Recortar Imagen
          </h3>
        </div>
        
        {/* Área del cropper */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "350px",
          marginBottom: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: "12px",
          overflow: "hidden"
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={16/9}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            style={{
              containerStyle: {
                borderRadius: "12px"
              }
            }}
          />
        </div>
        
        {/* Control de zoom */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ 
            fontSize: "14px", 
            fontWeight: "500",
            marginBottom: "8px", 
            display: "block",
            color: "#374151"
          }}>
            Zoom: {zoom.toFixed(1)}x
          </label>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e, value) => setZoom(value)}
            style={{ 
              width: "100%",
              color: "#4f46e5"
            }}
          />
        </div>
        
        {/* ✅ BOTONES MEJORADOS - SIEMPRE VISIBLES */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "16px",
          marginTop: "auto",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb"
        }}>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              padding: "14px 28px",
              borderRadius: "10px",
              border: "none",
              cursor: isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "500",
              flex: 1,
              transition: "background-color 0.2s",
              opacity: isProcessing ? 0.7 : 1
            }}
            onMouseOver={(e) => !isProcessing && (e.target.style.backgroundColor = "#4b5563")}
            onMouseOut={(e) => !isProcessing && (e.target.style.backgroundColor = "#6b7280")}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCropComplete}
            disabled={!croppedAreaPixels || isProcessing}
            style={{
              backgroundColor: !croppedAreaPixels || isProcessing ? "#9ca3af" : "#4f46e5",
              color: "white",
              padding: "14px 28px",
              borderRadius: "10px",
              border: "none",
              cursor: !croppedAreaPixels || isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "500",
              flex: 1,
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => {
              if (!isProcessing && croppedAreaPixels) {
                e.target.style.backgroundColor = "#4338ca";
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing && croppedAreaPixels) {
                e.target.style.backgroundColor = "#4f46e5";
              }
            }}
          >
            {isProcessing ? "Procesando..." : "✓ Recortar y Subir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Componente de carga de imágenes mejorado
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (file) => {
    if (!file) return;
    
    // Validar tipo de archivo
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)) {
      alert("Solo se permiten imágenes: JPG, PNG, GIF, WebP");
      return;
    }
    
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 10MB.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    setLoading(true);
    setShowCrop(false);
    
    const formData = new FormData();
    formData.append("file", new File([croppedBlob], "cropped-image.png", { 
      type: croppedBlob.type 
    }));

    try {
      const response = await fetch("https://email-platform-api-j0fg.onrender.com/upload-image/", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }
      
      const data = await response.json();
      const url = `https://email-platform-api-j0fg.onrender.com${data.url}`;
      onUploaded(url);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setImageSrc(null);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Subir Imagen (Drag & Drop, Crop, Redimensionado)
      </label>
      
      {/* Área de drop */}
      <div
        style={{
          border: dragActive ? "2px dashed #4f46e5" : "2px dashed #d1d5db",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          backgroundColor: dragActive ? "#f0f9ff" : "#fafafa",
          marginBottom: "12px",
          transition: "all 0.2s ease"
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleInputChange}
          disabled={loading}
          style={{ marginBottom: "8px" }}
        />
        <p style={{ 
          fontSize: "14px", 
          color: "#6b7280", 
          margin: "8px 0 0 0" 
        }}>
          O arrastra una imagen aquí (máximo 10MB)
        </p>
        {loading && (
          <p style={{ fontSize: "12px", color: "#4f46e5", margin: "8px 0 0 0" }}>
            Subiendo imagen...
          </p>
        )}
      </div>
      
      {/* Modal de recorte */}
      {showCrop && imageSrc && (
        <CropModal
          imageSrc={imageSrc}
          onComplete={handleCropComplete}
          onCancel={() => {
            setShowCrop(false);
            setImageSrc(null);
          }}
        />
      )}
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL EmailCompose
const EmailCompose = () => {
  const [formData, setFormData] = useState({ 
    to: '', 
    subject: '', 
    body: '', 
    mailbox_id: '' 
  });
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
        console.error("Error cargando buzones:", error);
        setStatus('Error cargando buzones de correo');
      }
    };
    fetchMailboxes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (content) => {
    setFormData(prev => ({ ...prev, body: content }));
  };

  const insertImageInQuill = (imageUrl) => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertEmbed(range ? range.index : 0, "image", imageUrl);
    
    // Actualizar el contenido
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML,
    }));
  };

  const handleEmoji = (emojiObj) => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const selection = editor.getSelection() || { index: editor.getLength() };
    editor.insertText(selection.index, emojiObj.emoji);
    setShowEmoji(false);
    
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML,
    }));
  };

  const handleImageUploaded = (imageUrl) => {
    insertImageInQuill(imageUrl);
    setGalleryRefresh(prev => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const emailData = {
        to: formData.to,
        subject: formData.subject,
        body: 'Este correo requiere un cliente que soporte HTML.',
        html_body: formData.body, // ✅ Aquí va el HTML para tracking
      };

      if (formData.mailbox_id && formData.mailbox_id !== '') {
        emailData.mailbox_id = parseInt(formData.mailbox_id);
      }

      await api.post('/emails/send', emailData);
      setStatus('¡Correo enviado exitosamente! 🎉');
      
      // Limpiar formulario
      setFormData({ to: '', subject: '', body: '', mailbox_id: '' });
      if (quillRef.current) {
        quillRef.current.getEditor().setContents([]);
      }
      
    } catch (error) {
      console.error("Error enviando email:", error);
      setStatus('Error al enviar correo: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          📧 Redactar Correo Ultra Completo
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selección de buzón */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Buzón de envío</label>
            <select
              name="mailbox_id"
              value={formData.mailbox_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Seleccionar buzón...</option>
              {mailboxes.map(mailbox => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name} ({mailbox.email})
                </option>
              ))}
            </select>
          </div>

          {/* Destinatario */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Destinatario</label>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="destinatario@example.com"
            />
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Asunto</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Asunto del correo"
            />
          </div>

          {/* Editor de contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido del mensaje
            </label>
            
            {/* Cargador de imágenes mejorado */}
            <ImageUploader onUploaded={handleImageUploaded} />
            
            {/* Buscador de galería */}
            <input
              type="text"
              placeholder="🔍 Buscar en galería de imágenes..."
              value={galleryFilter}
              onChange={e => setGalleryFilter(e.target.value)}
              className="mb-3 px-3 py-2 border border-gray-300 rounded-md"
              style={{ width: "70%" }}
            />
            
            {/* Galería de imágenes */}
            <ImageGallery
              onSelect={insertImageInQuill}
              refreshTrigger={galleryRefresh}
              filter={galleryFilter}
            />
            
            {/* Botón de emojis */}
            <div className="mb-3">
              <button 
                type="button" 
                onClick={() => setShowEmoji(!showEmoji)}
                className="bg-yellow-200 hover:bg-yellow-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                😊 Insertar Emoji
              </button>
            </div>
            
            {/* Selector de emojis */}
            {showEmoji && (
              <div className="mb-4">
                <EmojiPicker 
                  onEmojiClick={handleEmoji}
                  width="100%"
                  height="300px"
                />
              </div>
            )}
            
            {/* Editor Quill */}
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.body}
              onChange={handleQuillChange}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white"
              style={{ minHeight: "300px" }}
              placeholder="Escribe tu mensaje aquí... Puedes usar formato rico, imágenes, enlaces y más."
            />
          </div>

          {/* Vista previa */}
          <div className="mt-4 mb-2 p-4 border rounded-lg bg-gray-50">
            <label className="block text-sm font-bold text-gray-600 mb-2">
              📱 Vista previa del mensaje:
            </label>
            <div 
              dangerouslySetInnerHTML={{ __html: formData.body || "<p><em>El contenido aparecerá aquí...</em></p>" }} 
              style={{ 
                fontSize: "16px",
                minHeight: "40px",
                padding: "8px"
              }} 
            />
          </div>

          {/* Botón de envío */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors"
            >
              {loading ? '📤 Enviando...' : '🚀 Enviar Correo'}
            </button>
          </div>

          {/* Mensaje de estado */}
          {status && (
            <div className={`p-4 rounded-lg ${
              status.includes("Error") || status.includes("error")
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
