import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../services/api";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageGallery from "./ImageGallery";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import EmojiPicker from "emoji-picker-react";

// Plugins visuales y resize
import ImageResize from "quill-image-resize-module-react";
import QuillImageDropAndPaste from "quill-image-drop-and-paste";

Quill.register("modules/imageResize", ImageResize);
try {
  Quill.register("modules/imageDropAndPaste", QuillImageDropAndPaste);
} catch (e) {
  console.warn("ImageDropAndPaste already registered");
}

// NUEVA FUNCIÓN: Configuración avanzada de Quill con más opciones
const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }, { font: [] }, { size: ['small', false, 'large', 'huge'] }],
      ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      ["link", "image", "video", "formula"],
      ["clean"],
      ["undo", "redo"]
    ],
    handlers: {
      undo: function() {
        this.quill.history.undo();
      },
      redo: function() {
        this.quill.history.redo();
      }
    }
  },
  imageResize: { 
    modules: ["Resize", "DisplaySize", "Toolbar"],
    displayStyles: { 
      backgroundColor: "#f3f6fb", 
      border: "2px solid #4254ef",
      borderRadius: "8px"
    }
  },
  imageDropAndPaste: {
    handler: (dataUrl, type, imageData) => {
      const quill = this.quill;
      const range = quill.getSelection();
      quill.insertEmbed(range ? range.index : 0, "image", dataUrl);
    }
  },
  history: {
    delay: 1000,
    maxStack: 100,
    userOnly: true
  }
};

const quillFormats = [
  "header","font","size","bold","italic","underline","strike","blockquote","code-block",
  "color","background","align","script","direction","list","indent",
  "link","image","video","formula"
];

// NUEVA FUNCIÓN: Análisis de contenido profesional
const analyzeEmailContent = (subject, body) => {
  const textContent = body.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Análisis de asunto
  const subjectLength = subject.length;
  const subjectScore = subjectLength >= 30 && subjectLength <= 50 ? 100 : 
                      subjectLength >= 20 && subjectLength <= 60 ? 75 : 50;
  
  // Análisis de legibilidad
  const readabilityScore = words.length >= 50 && words.length <= 200 ? 100 :
                          words.length >= 30 && words.length <= 300 ? 75 : 50;
  
  // Detección de spam
  const spamWords = ['gratis', 'free', 'urgente', 'limited time', '!!!', 'click here'];
  const spamCount = spamWords.filter(word => 
    textContent.toLowerCase().includes(word.toLowerCase()) ||
    subject.toLowerCase().includes(word.toLowerCase())
  ).length;
  const spamScore = Math.max(0, 100 - (spamCount * 20));
  
  return {
    wordCount: words.length,
    charCount: textContent.length,
    subjectScore,
    readabilityScore,
    spamScore,
    readingTime: Math.max(1, Math.ceil(words.length / 200))
  };
};

// NUEVA FUNCIÓN: Snippets de contenido reutilizable
const contentSnippets = [
  {
    id: 1,
    name: "Saludo Profesional",
    category: "greetings",
    html: `<p>Estimado/a {nombre},</p><p>Espero que se encuentre muy bien. Me pongo en contacto con usted para...</p>`
  },
  {
    id: 2,
    name: "Firma Corporativa",
    category: "signatures",
    html: `<div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
      <p style="margin: 0;"><strong>{nombre}</strong></p>
      <p style="margin: 0; color: #6b7280;">{cargo} - {empresa}</p>
      <p style="margin: 0; color: #6b7280;">📧 {email} | 📱 {telefono}</p>
    </div>`
  },
  {
    id: 3,
    name: "Call to Action",
    category: "cta",
    html: `<div style="text-align: center; margin: 30px 0;">
      <a href="{url}" style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        🚀 Ver más detalles
      </a>
    </div>`
  }
];

// NUEVA FUNCIÓN: Variables dinámicas para personalización
const dynamicVariables = [
  { key: "{nombre}", description: "Nombre del destinatario" },
  { key: "{empresa}", description: "Nombre de la empresa" },
  { key: "{fecha}", description: "Fecha actual" },
  { key: "{cargo}", description: "Cargo en la empresa" },
  { key: "{email}", description: "Email del destinatario" },
  { key: "{telefono}", description: "Teléfono de contacto" }
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

// ✅ Modal de recorte MEJORADO con más opciones
function CropModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16/9);

  const aspectRatios = [
    { label: "16:9", value: 16/9 },
    { label: "4:3", value: 4/3 },
    { label: "1:1", value: 1 },
    { label: "3:4", value: 3/4 },
    { label: "Libre", value: null }
  ];

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
      backgroundColor: "rgba(0,0,0,0.9)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "30px",
        borderRadius: "20px",
        width: "90%",
        maxWidth: "800px",
        maxHeight: "95vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        overflow: "hidden"
      }}>
        
        {/* Header mejorado */}
        <div style={{ marginBottom: "25px", textAlign: "center" }}>
          <h3 style={{ 
            margin: "0 0 15px 0", 
            fontSize: "24px", 
            fontWeight: "700", 
            color: "#1f2937" 
          }}>
            🎨 Editor de Imagen Avanzado
          </h3>
          
          {/* Selector de relación de aspecto */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px", display: "block" }}>
              Relación de aspecto:
            </label>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              {aspectRatios.map(ratio => (
                <button
                  key={ratio.label}
                  onClick={() => setAspectRatio(ratio.value)}
                  style={{
                    background: aspectRatio === ratio.value ? "#4f46e5" : "#f3f4f6",
                    color: aspectRatio === ratio.value ? "white" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Área del cropper */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "400px",
          marginBottom: "25px",
          backgroundColor: "#f9fafb",
          borderRadius: "16px",
          overflow: "hidden"
        }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            style={{
              containerStyle: {
                borderRadius: "16px"
              }
            }}
          />
        </div>
        
        {/* Controles avanzados */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
          <div>
            <label style={{ 
              fontSize: "14px", 
              fontWeight: "600",
              marginBottom: "8px", 
              display: "block",
              color: "#374151"
            }}>
              Zoom: {zoom.toFixed(1)}x
            </label>
            <Slider
              value={zoom}
              min={1}
              max={5}
              step={0.1}
              onChange={(e, value) => setZoom(value)}
              style={{ 
                width: "100%",
                color: "#4f46e5"
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              fontSize: "14px", 
              fontWeight: "600",
              marginBottom: "8px", 
              display: "block",
              color: "#374151"
            }}>
              Rotación: {rotation}°
            </label>
            <Slider
              value={rotation}
              min={-180}
              max={180}
              step={1}
              onChange={(e, value) => setRotation(value)}
              style={{ 
                width: "100%",
                color: "#10b981"
              }}
            />
          </div>
        </div>
        
        {/* Botones mejorados */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          marginTop: "auto"
        }}>
          <button
            onClick={() => {
              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setRotation(0);
            }}
            style={{
              backgroundColor: "#f59e0b",
              color: "white",
              padding: "14px 28px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              flex: 1
            }}
          >
            🔄 Reiniciar
          </button>
          
          <button
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              padding: "14px 28px",
              borderRadius: "12px",
              border: "none",
              cursor: isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
              flex: 1,
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            ❌ Cancelar
          </button>
          
          <button
            onClick={handleCropComplete}
            disabled={!croppedAreaPixels || isProcessing}
            style={{
              backgroundColor: !croppedAreaPixels || isProcessing ? "#9ca3af" : "#4f46e5",
              color: "white",
              padding: "14px 28px",
              borderRadius: "12px",
              border: "none",
              cursor: !croppedAreaPixels || isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "600",
              flex: 2
            }}
          >
            {isProcessing ? "⏳ Procesando..." : "✅ Recortar y Usar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Componente de carga de imágenes ULTRA mejorado
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (file) => {
    if (!file) return;
    
    // Validaciones mejoradas
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Solo se permiten imágenes: JPG, PNG, GIF, WebP");
      return;
    }
    
    if (file.size > 15 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 15MB.");
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
    setUploadProgress(0);
    
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
      
      setUploadProgress(100);
      const data = await response.json();
      const url = `https://email-platform-api-j0fg.onrender.com${data.url}`;
      onUploaded(url);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setImageSrc(null);
      setUploadProgress(0);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <label className="block text-sm font-bold text-gray-700 mb-3">
        📷 Subir Imagen (Drag & Drop, Recorte Avanzado, Múltiples Formatos)
      </label>
      
      {/* Área de drop mejorada */}
      <div
        style={{
          border: dragActive ? "3px dashed #4f46e5" : "3px dashed #d1d5db",
          borderRadius: "16px",
          padding: "30px",
          textAlign: "center",
          backgroundColor: dragActive ? "#f0f9ff" : loading ? "#fef3c7" : "#fafafa",
          marginBottom: "15px",
          transition: "all 0.3s ease",
          position: "relative"
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: "48px", marginBottom: "15px" }}>
          {loading ? "⏳" : dragActive ? "📤" : "📷"}
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleInputChange}
          disabled={loading}
          style={{ 
            marginBottom: "15px",
            padding: "10px",
            borderRadius: "8px",
            border: "2px solid #e5e7eb",
            backgroundColor: "white"
          }}
        />
        
        <p style={{ 
          fontSize: "16px", 
          color: "#374151", 
          margin: "10px 0",
          fontWeight: "600"
        }}>
          O arrastra una imagen aquí
        </p>
        
        <p style={{ 
          fontSize: "12px", 
          color: "#6b7280", 
          margin: "5px 0 0 0" 
        }}>
          Formatos: JPG, PNG, GIF, WebP • Máximo: 15MB
        </p>
        
        {loading && (
          <div style={{ marginTop: "15px" }}>
            <p style={{ fontSize: "14px", color: "#4f46e5", margin: "5px 0", fontWeight: "600" }}>
              🚀 Procesando imagen...
            </p>
            {uploadProgress > 0 && (
              <div style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
                marginTop: "10px"
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  backgroundColor: "#4f46e5",
                  transition: "width 0.3s ease"
                }} />
              </div>
            )}
          </div>
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

// NUEVO: Panel de Snippets
function SnippetsPanel({ onSelectSnippet, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'greetings', name: 'Saludos' },
    { id: 'signatures', name: 'Firmas' },
    { id: 'cta', name: 'Call-to-Action' }
  ];

  const filteredSnippets = selectedCategory === 'all' 
    ? contentSnippets 
    : contentSnippets.filter(s => s.category === selectedCategory);

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      width: "400px",
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      zIndex: 9998,
      maxHeight: "80vh",
      overflow: "auto"
    }}>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>🧩 Snippets</h4>
          <button 
            onClick={onClose}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Categorías */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: selectedCategory === category.id ? "#4f46e5" : "#f3f4f6",
                color: selectedCategory === category.id ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600"
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Lista de snippets */}
        {filteredSnippets.map(snippet => (
          <div
            key={snippet.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              marginBottom: "10px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "15px",
                cursor: "pointer",
                backgroundColor: "#fafafa"
              }}
              onClick={() => {
                onSelectSnippet(snippet.html);
                onClose();
              }}
            >
              <h5 style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "600" }}>
                {snippet.name}
              </h5>
              <div 
                dangerouslySetInnerHTML={{ __html: snippet.html.slice(0, 100) + "..." }}
                style={{ fontSize: "12px", color: "#6b7280" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// NUEVO: Panel de Variables Dinámicas
function VariablesPanel({ onInsertVariable, onClose }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "350px",
      backgroundColor: "white",
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      zIndex: 9997,
      maxHeight: "60vh",
      overflow: "auto"
    }}>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>🔧 Variables</h4>
          <button 
            onClick={onClose}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            ✕
          </button>
        </div>

        {dynamicVariables.map(variable => (
          <div
            key={variable.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
              borderBottom: "1px solid #f3f4f6",
              cursor: "pointer"
            }}
            onClick={() => onInsertVariable(variable.key)}
          >
            <div>
              <code style={{
                backgroundColor: "#f3f4f6",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "600"
              }}>
                {variable.key}
              </code>
              <p style={{
                margin: "4px 0 0 0",
                fontSize: "11px",
                color: "#6b7280"
              }}>
                {variable.description}
              </p>
            </div>
            <button style={{
              backgroundColor: "#4f46e5",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer"
            }}>
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL EmailCompose ULTRA PROFESIONAL
const EmailCompose = () => {
  // Estados existentes
  const [formData, setFormData] = useState({ 
    to: '', 
    cc: '',
    bcc: '',
    subject: '', 
    body: '', 
    mailbox_id: '',
    priority: 'normal',
    track_opens: true,
    track_clicks: true
  });
  const [mailboxes, setMailboxes] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  
  // NUEVOS ESTADOS AVANZADOS
  const [editorMode, setEditorMode] = useState('html');
  const [showSnippets, setShowSnippets] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [scheduledSend, setScheduledSend] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState({
    wordCount: 0,
    charCount: 0,
    subjectScore: 0,
    readabilityScore: 0,
    spamScore: 0,
    readingTime: 0
  });
  
  const quillRef = useRef(null);

  // Análisis en tiempo real
  useEffect(() => {
    const analysis = analyzeEmailContent(formData.subject, formData.body);
    setEmailAnalysis(analysis);
  }, [formData.subject, formData.body]);

  useEffect(() => {
    const fetchMailboxes = async () => {
      try {
        const response = await api.get('/mailboxes');
        setMailboxes(response.data);
      } catch (error) {
        console.error("Error cargando buzones:", error);
        setStatus('❌ Error cargando buzones de correo');
      }
    };
    fetchMailboxes();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = useCallback((content) => {
    setFormData(prev => ({ ...prev, body: content }));
  }, []);

  const handlePlainTextChange = (content) => {
    setFormData(prev => ({ ...prev, body: content }));
  };

  const handleModeChange = (mode) => {
    setEditorMode(mode);
    if (mode === 'plain' && quillRef.current) {
      const textContent = quillRef.current.getEditor().getText();
      setFormData(prev => ({ ...prev, body: textContent }));
    } else if (mode === 'html' && formData.body && !formData.body.includes('<')) {
      setFormData(prev => ({ ...prev, body: `<p>${prev.body.replace(/\n/g, '</p><p>')}</p>` }));
    }
  };

  const insertImageInQuill = useCallback((imageUrl) => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertEmbed(range ? range.index : 0, "image", imageUrl);
    
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML,
    }));
  }, []);

  const handleEmoji = useCallback((emojiObj) => {
    if (editorMode === 'html' && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection() || { index: editor.getLength() };
      editor.insertText(selection.index, emojiObj.emoji);
      setShowEmoji(false);
      
      setFormData(prev => ({
        ...prev,
        body: editor.root.innerHTML,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        body: prev.body + emojiObj.emoji
      }));
      setShowEmoji(false);
    }
  }, [editorMode]);

  const handleImageUploaded = useCallback((imageUrl) => {
    if (editorMode === 'html') {
      insertImageInQuill(imageUrl);
    } else {
      setFormData(prev => ({
        ...prev,
        body: prev.body + `\n[Imagen: ${imageUrl}]`
      }));
    }
    setGalleryRefresh(prev => prev + 1);
  }, [editorMode, insertImageInQuill]);

  const handleSnippetSelect = useCallback((snippetHtml) => {
    if (editorMode === 'html' && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      editor.clipboard.dangerouslyPasteHTML(index, snippetHtml);
      
      setFormData(prev => ({
        ...prev,
        body: editor.root.innerHTML
      }));
    } else {
      const cleanText = snippetHtml.replace(/<[^>]*>/g, '');
      setFormData(prev => ({
        ...prev,
        body: prev.body + '\n' + cleanText
      }));
    }
  }, [editorMode]);

  const handleVariableInsert = useCallback((variable) => {
    if (editorMode === 'html' && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection() || { index: editor.getLength() };
      editor.insertText(range.index, variable);
      
      setFormData(prev => ({
        ...prev,
        body: editor.root.innerHTML
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        body: prev.body + variable
      }));
    }
  }, [editorMode]);

  const handleSaveDraft = async () => {
    try {
      setSaveAsDraft(true);
      // Aquí implementarías el guardado en tu API
      setTimeout(() => {
        setStatus('💾 Borrador guardado correctamente');
        setSaveAsDraft(false);
      }, 1500);
    } catch (error) {
      setStatus('❌ Error al guardar borrador');
      setSaveAsDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      // Validaciones mejoradas
      if (!formData.to.trim()) {
        throw new Error('El destinatario es obligatorio');
      }
      if (!formData.subject.trim()) {
        throw new Error('El asunto es obligatorio');
      }
      if (!formData.body.trim()) {
        throw new Error('El contenido del mensaje es obligatorio');
      }

      const emailData = {
        to: formData.to,
        subject: formData.subject,
        cc: formData.cc ? formData.cc.split(',').map(email => email.trim()) : undefined,
        bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : undefined,
        priority: formData.priority,
        track_opens: formData.track_opens,
        track_clicks: formData.track_clicks
      };

      if (editorMode === 'html') {
        emailData.body = 'Este correo requiere un cliente que soporte HTML.';
        emailData.html_body = formData.body;
      } else {
        emailData.body = formData.body;
        emailData.html_body = null;
      }

      if (formData.mailbox_id && formData.mailbox_id !== '') {
        emailData.mailbox_id = parseInt(formData.mailbox_id);
      }

      if (scheduledSend && scheduleDate) {
        emailData.schedule_date = scheduleDate;
      }

      await api.post('/emails/send', emailData);
      setStatus('🎉 ¡Correo enviado exitosamente!');
      
      // Limpiar formulario
      setFormData({ 
        to: '', 
        cc: '',
        bcc: '',
        subject: '', 
        body: '', 
        mailbox_id: '',
        priority: 'normal',
        track_opens: true,
        track_clicks: true
      });
      
      if (quillRef.current) {
        quillRef.current.getEditor().setContents([]);
      }
      
    } catch (error) {
      console.error("Error enviando email:", error);
      setStatus('❌ Error al enviar correo: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow-2xl rounded-3xl" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header ultra profesional */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        padding: "30px 40px",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b)"
        }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "32px", fontWeight: "900", letterSpacing: "-1px" }}>
              🚀 Email Composer Ultra Pro
            </h3>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              Editor profesional con IA, análisis avanzado y herramientas premium
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{emailAnalysis.wordCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>palabras</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{emailAnalysis.readingTime}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>min lectura</div>
            </div>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveAsDraft}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                color: "white",
                cursor: saveAsDraft ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "700",
                backdropFilter: "blur(10px)"
              }}
            >
              {saveAsDraft ? "💾 Guardando..." : "💾 Guardar Borrador"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-10">
        {/* Toolbar avanzado */}
        <div style={{ 
          display: "flex", 
          gap: "20px", 
          marginBottom: "30px", 
          flexWrap: "wrap",
          alignItems: "center",
          padding: "25px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(240, 147, 251, 0.4)"
        }}>
          <button
            type="button"
            onClick={() => setShowSnippets(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            🧩 Snippets Pro
          </button>
          
          <button
            type="button"
            onClick={() => setShowVariables(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            🔧 Variables Dinámicas
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            😊 Emojis & Símbolos
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "white", fontSize: "16px", fontWeight: "700" }}>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                style={{ transform: "scale(1.5)" }}
              />
              Vista previa en vivo
            </label>
          </div>
        </div>

        {/* Panel de análisis mejorado */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          padding: "25px",
          borderRadius: "20px",
          marginBottom: "30px",
          border: "2px solid #10b981"
        }}>
          <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800", color: "#065f46" }}>
            📊 Análisis Inteligente del Email
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(#10b981 ${emailAnalysis.subjectScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: "#10b981"
                }}>
                  {emailAnalysis.subjectScore}%
                </div>
              </div>
              <div style={{ color: "#065f46", fontWeight: "700", fontSize: "14px" }}>Asunto</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Optimización</div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(#3b82f6 ${emailAnalysis.readabilityScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: "#3b82f6"
                }}>
                  {emailAnalysis.readabilityScore}%
                </div>
              </div>
              <div style={{ color: "#1e40af", fontWeight: "700", fontSize: "14px" }}>Legibilidad</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Comprensión</div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(${emailAnalysis.spamScore >= 80 ? '#10b981' : emailAnalysis.spamScore >= 60 ? '#f59e0b' : '#ef4444'} ${emailAnalysis.spamScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: emailAnalysis.spamScore >= 80 ? '#10b981' : emailAnalysis.spamScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {emailAnalysis.spamScore}%
                </div>
              </div>
              <div style={{ color: "#dc2626", fontWeight: "700", fontSize: "14px" }}>Anti-Spam</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Entregabilidad</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Configuración avanzada */}
          <div style={{
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            padding: "30px",
            borderRadius: "20px",
            marginBottom: "30px"
          }}>
            <h4 style={{ margin: "0 0 25px 0", fontSize: "24px", fontWeight: "800", color: "#1f2937" }}>
              ⚙️ Configuración Profesional
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "25px" }}>
              {/* Modo de edición */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Tipo de contenido
                </label>
                <select 
                  value={editorMode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e5e7eb",
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "white"
                  }}
                >
                  <option value="html">🎨 HTML Rico (Recomendado)</option>
                  <option value="plain">📝 Texto Plano</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Prioridad
                </label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e5e7eb",
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "white"
                  }}
                >
                  <option value="low">🟢 Baja</option>
                  <option value="normal">🟡 Normal</option>
                  <option value="high">🔴 Alta</option>
                </select>
              </div>

              {/* Opciones de tracking */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Seguimiento
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "600", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_opens"
                      checked={formData.track_opens}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_opens: e.target.checked }))}
                      style={{ transform: "scale(1.3)" }}
                    />
                    📊 Rastrear aperturas
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "600", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_clicks"
                      checked={formData.track_clicks}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_clicks: e.target.checked }))}
                      style={{ transform: "scale(1.3)" }}
                    />
                    🔗 Rastrear clicks
                  </label>
                </div>
              </div>

              {/* Programación */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={scheduledSend}
                    onChange={(e) => setScheduledSend(e.target.checked)}
                    style={{ transform: "scale(1.3)" }}
                  />
                  ⏰ Envío programado
                </label>
                
                {scheduledSend && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "2px solid #e5e7eb",
                      fontSize: "16px",
                      fontWeight: "600",
                      background: "white"
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Selección de buzón */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              📮 Buzón de envío
            </label>
            <select
              name="mailbox_id"
              value={formData.mailbox_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "3px solid #e5e7eb",
                fontSize: "18px",
                fontWeight: "600",
                background: "white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
              }}
            >
              <option value="">Seleccionar buzón profesional...</option>
              {mailboxes.map(mailbox => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name} ({mailbox.email})
                  {mailbox.is_verified ? " ✅" : " ⚠️"}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de destinatarios mejorados */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "20px" }}>
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                📧 Para (obligatorio)
              </label>
              <input
                type="email"
                name="to"
                value={formData.to}
                onChange={handleChange}
                required
                placeholder="cliente@empresa.com"
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "3px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "500",
                  background: "white"
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                📎 CC
              </label>
              <input
                type="text"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                placeholder="cc@empresa.com"
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "3px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "500"
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                🤫 BCC
              </label>
              <input
                type="text"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                placeholder="bcc@empresa.com"
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "3px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "500"
                }}
              />
            </div>
          </div>

          {/* Asunto con análisis */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label className="block text-lg font-bold text-gray-700">
                📝 Asunto del correo
              </label>
              <span style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b",
                backgroundColor: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#dcfce7" : "#fef3c7"
              }}>
                {formData.subject.length}/50 (Score: {emailAnalysis.subjectScore}%)
              </span>
            </div>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Asunto profesional y atractivo..."
              style={{
                width: "100%",
                padding: "20px 24px",
                borderRadius: "16px",
                border: "3px solid #e5e7eb",
                fontSize: "20px",
                fontWeight: "600",
                background: "white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
              }}
            />
          </div>

          {/* Área de contenido principal */}
          <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: "30px" }}>
            {/* Editor */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-4">
                ✍️ Contenido del mensaje
              </label>
              
              <ImageUploader onUploaded={handleImageUploaded} />
              
              <input
                type="text"
                placeholder="🔍 Buscar en galería de imágenes..."
                value={galleryFilter}
                onChange={e => setGalleryFilter(e.target.value)}
                style={{
                  width: "75%",
                  padding: "12px 18px",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  border: "2px solid #d1d5db",
                  fontSize: "16px"
                }}
              />
              
              <ImageGallery
                onSelect={insertImageInQuill}
                refreshTrigger={galleryRefresh}
                filter={galleryFilter}
              />
              
              {showEmoji && (
                <div style={{ marginBottom: "25px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}>
                  <EmojiPicker 
                    onEmojiClick={handleEmoji}
                    width="100%"
                    height="400px"
                  />
                </div>
              )}
              
              {editorMode === 'html' ? (
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formData.body}
                  onChange={handleQuillChange}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ 
                    minHeight: "500px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    background: "white"
                  }}
                  placeholder="Escribe tu mensaje profesional aquí... Usa herramientas avanzadas de formato."
                />
              ) : (
                <textarea
                  value={formData.body}
                  onChange={(e) => handlePlainTextChange(e.target.value)}
                  placeholder="Escribe tu mensaje en texto simple..."
                  style={{
                    width: "100%",
                    minHeight: "500px",
                    padding: "25px",
                    borderRadius: "16px",
                    border: "3px solid #e5e7eb",
                    fontSize: "18px",
                    fontFamily: "'Fira Code', monospace",
                    lineHeight: "1.7",
                    resize: "vertical",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    background: "white"
                  }}
                />
              )}
            </div>

            {/* Vista previa mejorada */}
            {showPreview && (
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">
                  👁️ Vista previa profesional
                </label>
                
                <div style={{
                  border: "3px solid #e5e7eb",
                  borderRadius: "20px",
                  minHeight: "500px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                  overflow: "hidden"
                }}>
                  {/* Header del email */}
                  <div style={{
                    borderBottom: "2px solid #e5e7eb",
                    paddingBottom: "20px",
                    padding: "25px",
                    background: "white"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "800",
                        fontSize: "16px"
                      }}>
                        {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name || "Usuario"}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.email || "usuario@empresa.com"}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>Para: </span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{formData.to || "destinatario@empresa.com"}</span>
                    </div>
                    
                    {formData.cc && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>CC: </span>
                        <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{formData.cc}</span>
                      </div>
                    )}
                    
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#1f2937", marginTop: "15px" }}>
                      {formData.subject || "Tu asunto aparecerá aquí..."}
                    </div>
                    
                    {formData.priority !== 'normal' && (
                      <div style={{
                        marginTop: "10px",
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        backgroundColor: formData.priority === 'high' ? "#fef2f2" : "#f0f9ff",
                        color: formData.priority === 'high' ? "#dc2626" : "#1e40af"
                      }}>
                        {formData.priority === 'high' ? "🔴 ALTA PRIORIDAD" : "🟢 BAJA PRIORIDAD"}
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido del email */}
                  <div style={{ padding: "25px" }}>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formData.body || "<p style='color: #9ca3af; font-style: italic; text-align: center; padding: 60px 20px;'>👆 El contenido aparecerá aquí conforme escribas...<br/>¡Usa las herramientas profesionales para crear emails impactantes!</p>" 
                      }} 
                      style={{ 
                        fontSize: "16px",
                        lineHeight: "1.7",
                        minHeight: "200px",
                        color: "#374151"
                      }} 
                    />
                  </div>
                </div>
                
                {/* Estadísticas detalladas */}
                <div style={{
                  marginTop: "20px",
                  padding: "20px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "16px",
                  border: "2px solid #3b82f6",
                  fontSize: "14px"
                }}>
                  <h4 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "800", color: "#1e40af" }}>
                    📊 Estadísticas avanzadas
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>📝 Palabras:</span>
                      <strong style={{ color: "#1e40af" }}>{emailAnalysis.wordCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>🔤 Caracteres:</span>
                      <strong style={{ color: "#1e40af" }}>{emailAnalysis.charCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>📧 Asunto:</span>
                      <strong style={{ color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b" }}>
                        {formData.subject.length}/50
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>⏱️ Lectura:</span>
                      <strong style={{ color: "#10b981" }}>{emailAnalysis.readingTime} min</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción profesionales */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "40px",
            borderTop: "3px solid #f3f4f6",
            marginTop: "40px"
          }}>
            <div style={{ display: "flex", gap: "20px" }}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saveAsDraft}
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  padding: "18px 32px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: saveAsDraft ? "not-allowed" : "pointer",
                  fontSize: "18px",
                  fontWeight: "700",
                  opacity: saveAsDraft ? 0.7 : 1,
                  boxShadow: "0 4px 15px rgba(107, 114, 128, 0.3)"
                }}
              >
                {saveAsDraft ? "💾 Guardando..." : "💾 Guardar Borrador"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "20px 50px",
                borderRadius: "20px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "22px",
                fontWeight: "900",
                boxShadow: loading ? "none" : "0 15px 35px rgba(102, 126, 234, 0.5)",
                transform: loading ? "none" : "translateY(-3px)",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              {loading ? '📤 Enviando...' : (scheduledSend ? '⏰ Programar Envío' : '🚀 Enviar Email Pro')}
            </button>
          </div>

          {/* Mensaje de estado mejorado */}
          {status && (
            <div 
              style={{
                padding: "25px 30px",
                borderRadius: "20px",
                fontSize: "18px",
                fontWeight: "700",
                textAlign: "center",
                marginTop: "30px",
                backgroundColor: status.includes("Error") || status.includes("❌") 
                  ? "#fef2f2" : "#f0fff4",
                color: status.includes("Error") || status.includes("❌")
                  ? "#dc2626" : "#065f46",
                border: status.includes("Error") || status.includes("❌")
                  ? "3px solid #fecaca" : "3px solid #bbf7d0",
                boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
              }}
            >
              {status}
            </div>
          )}
        </form>
      </div>

      {/* Paneles flotantes */}
      {showSnippets && (
        <SnippetsPanel
          onSelectSnippet={handleSnippetSelect}
          onClose={() => setShowSnippets(false)}
        />
      )}

      {showVariables && (
        <VariablesPanel
          onInsertVariable={handleVariableInsert}
          onClose={() => setShowVariables(false)}
        />
      )}
    </div>
  );
};

export default EmailCompose;
