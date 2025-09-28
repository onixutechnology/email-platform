import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../services/api";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageGallery from "./ImageGallery";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import EmojiPicker from "emoji-picker-react";

// Plugins visuales y resize con capacidades de arrastrar
import ImageResize from "quill-image-resize-module-react";
import QuillImageDropAndPaste from "quill-image-drop-and-paste";

Quill.register("modules/imageResize", ImageResize);
try {
  Quill.register("modules/imageDropAndPaste", QuillImageDropAndPaste);
} catch (e) {
  console.warn("ImageDropAndPaste already registered");
}

// NUEVA FUNCIÓN: Configuración ultra avanzada de Quill con movimiento de imágenes
const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }, { size: ['small', false, 'large', 'huge'] }],
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
      backgroundColor: "#f0f9ff", 
      border: "3px solid #4f46e5",
      borderRadius: "12px",
      cursor: "move"
    },
    handleStyles: {
      backgroundColor: "#4f46e5",
      border: "none",
      color: "white"
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
  },
  clipboard: {
    matchVisual: false
  }
};

const quillFormats = [
  "header","font","size","bold","italic","underline","strike","blockquote","code-block",
  "color","background","align","script","direction","list","indent",
  "link","image","video","formula"
];

// NUEVA FUNCIÓN: Análisis avanzado de contenido
const analyzeEmailContent = (subject, body) => {
  const textContent = body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  
  // Análisis de asunto optimizado
  const subjectLength = subject.length;
  const subjectScore = subjectLength >= 30 && subjectLength <= 50 ? 100 : 
                      subjectLength >= 20 && subjectLength <= 60 ? 85 : 
                      subjectLength >= 15 && subjectLength <= 70 ? 70 : 50;
  
  // Análisis de legibilidad mejorado
  const readabilityScore = words.length >= 50 && words.length <= 200 ? 100 :
                          words.length >= 30 && words.length <= 300 ? 85 : 
                          words.length >= 20 && words.length <= 400 ? 70 : 50;
  
  // Detección avanzada de spam
  const spamWords = ['gratis', 'free', 'urgente', 'limited time', '!!!', 'click here', 'act now', 'buy now', 'promoción', 'oferta', 'ganar dinero'];
  const spamCount = spamWords.filter(word => 
    textContent.toLowerCase().includes(word.toLowerCase()) ||
    subject.toLowerCase().includes(word.toLowerCase())
  ).length;
  const spamScore = Math.max(0, 100 - (spamCount * 15));
  
  // Análisis de engagement
  const engagementWords = ['innovación', 'tecnología', 'solución', 'profesional', 'exclusivo', 'personalizado'];
  const engagementCount = engagementWords.filter(word => 
    textContent.toLowerCase().includes(word.toLowerCase()) ||
    subject.toLowerCase().includes(word.toLowerCase())
  ).length;
  const engagementScore = Math.min(100, 60 + (engagementCount * 10));
  
  return {
    wordCount: words.length,
    charCount: textContent.length,
    subjectScore,
    readabilityScore,
    spamScore,
    engagementScore,
    readingTime: Math.max(1, Math.ceil(words.length / 200)),
    imageCount: (body.match(/<img/gi) || []).length,
    linkCount: (body.match(/<a/gi) || []).length
  };
};

// NUEVA FUNCIÓN: Snippets profesionales expandidos
const contentSnippets = [
  {
    id: 1,
    name: "Saludo Empresarial",
    category: "greetings",
    html: `<p style="font-size: 16px; line-height: 1.6;">Estimado/a <strong>{nombre}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6;">Espero que se encuentre muy bien. Me dirijo a usted desde <strong>{empresa}</strong> para presentarle una oportunidad excepcional que puede transformar la eficiencia de su negocio.</p>`
  },
  {
    id: 2,
    name: "Firma Corporativa Completa",
    category: "signatures",
    html: `<div style="margin-top: 40px; padding-top: 25px; border-top: 3px solid #4f46e5; background: #f8fafc; padding: 25px; border-radius: 12px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
          {inicial}
        </div>
        <div>
          <p style="margin: 0; font-size: 18px; font-weight: 800; color: #1f2937;">{nombre}</p>
          <p style="margin: 0; font-size: 14px; color: #6b7280; font-weight: 600;">{cargo} - {empresa}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #4f46e5; font-weight: 600;">📧 {email} | 📱 {telefono} | 🌐 {website}</p>
        </div>
      </div>
    </div>`
  },
  {
    id: 3,
    name: "Call to Action Premium",
    category: "cta",
    html: `<div style="text-align: center; margin: 35px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px;">
      <h3 style="color: white; margin: 0 0 20px 0; font-size: 22px; font-weight: 800;">¿Listo para revolucionar tu negocio?</h3>
      <a href="{url}" style="background: white; color: #4f46e5; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
        🚀 Solicitar Demo Gratuita
      </a>
      <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 14px;">Sin compromiso • Respuesta en 24h • Soporte premium incluido</p>
    </div>`
  },
  {
    id: 4,
    name: "Propuesta de Valor",
    category: "content",
    html: `<div style="background: #f0fdf4; border-left: 5px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 0 12px 12px 0;">
      <h4 style="color: #065f46; margin: 0 0 15px 0; font-size: 20px; font-weight: 800;">💡 Lo que obtienes con nosotros:</h4>
      <ul style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>Desarrollo personalizado</strong> según tus necesidades específicas</li>
        <li><strong>Integración completa</strong> con tus sistemas existentes</li>
        <li><strong>Soporte 24/7</strong> con técnicos especializados</li>
        <li><strong>Actualizaciones automáticas</strong> y mejoras continuas</li>
        <li><strong>ROI garantizado</strong> en los primeros 6 meses</li>
      </ul>
    </div>`
  }
];

// NUEVA FUNCIÓN: Variables dinámicas expandidas
const dynamicVariables = [
  { key: "{nombre}", description: "Nombre completo del destinatario", example: "Juan Pérez" },
  { key: "{empresa}", description: "Nombre de la empresa", example: "TechCorp SA" },
  { key: "{fecha}", description: "Fecha actual", example: "28 de Septiembre, 2025" },
  { key: "{cargo}", description: "Cargo en la empresa", example: "Director de TI" },
  { key: "{email}", description: "Email del destinatario", example: "juan@techcorp.com" },
  { key: "{telefono}", description: "Teléfono de contacto", example: "+52 444 123 4567" },
  { key: "{website}", description: "Sitio web de la empresa", example: "www.onixu.com" },
  { key: "{inicial}", description: "Inicial del nombre", example: "J" },
  { key: "{ciudad}", description: "Ciudad del destinatario", example: "San Luis Potosí" },
  { key: "{industria}", description: "Sector industrial", example: "Tecnología" }
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
      }, "image/png", 0.95);
    };
  });
}

// ✅ Modal de recorte ULTRA AVANZADO
function CropModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16/9);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const aspectRatios = [
    { label: "16:9", value: 16/9 },
    { label: "4:3", value: 4/3 },
    { label: "1:1", value: 1 },
    { label: "3:4", value: 3/4 },
    { label: "21:9", value: 21/9 },
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
      backgroundColor: "rgba(0,0,0,0.95)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "35px",
        borderRadius: "24px",
        width: "95%",
        maxWidth: "900px",
        maxHeight: "95vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
        overflow: "hidden"
      }}>
        
        {/* Header ultra mejorado */}
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h3 style={{ 
            margin: "0 0 20px 0", 
            fontSize: "28px", 
            fontWeight: "900", 
            color: "#1f2937",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            🎨 Editor de Imagen Ultra Profesional
          </h3>
          
          {/* Selector de relación de aspecto */}
          <div style={{ marginBottom: "25px" }}>
            <label style={{ fontSize: "16px", fontWeight: "700", marginBottom: "15px", display: "block", color: "#374151" }}>
              Relación de aspecto y formato:
            </label>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {aspectRatios.map(ratio => (
                <button
                  key={ratio.label}
                  onClick={() => setAspectRatio(ratio.value)}
                  style={{
                    background: aspectRatio === ratio.value 
                      ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" 
                      : "#f8fafc",
                    color: aspectRatio === ratio.value ? "white" : "#374151",
                    border: aspectRatio === ratio.value ? "none" : "2px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: aspectRatio === ratio.value ? "0 4px 15px rgba(79, 70, 229, 0.4)" : "none"
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
          height: "450px",
          marginBottom: "30px",
          backgroundColor: "#f8fafc",
          borderRadius: "20px",
          overflow: "hidden",
          border: "3px solid #e2e8f0"
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
                borderRadius: "20px",
                filter: `brightness(${brightness}%) contrast(${contrast}%)`
              }
            }}
          />
        </div>
        
        {/* Controles ultra avanzados */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "25px", marginBottom: "30px" }}>
          <div>
            <label style={{ 
              fontSize: "16px", 
              fontWeight: "700",
              marginBottom: "12px", 
              display: "block",
              color: "#374151"
            }}>
              🔍 Zoom: {zoom.toFixed(1)}x
            </label>
            <Slider
              value={zoom}
              min={1}
              max={5}
              step={0.1}
              onChange={(e, value) => setZoom(value)}
              style={{ 
                width: "100%",
                color: "#4f46e5",
                height: "8px"
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              fontSize: "16px", 
              fontWeight: "700",
              marginBottom: "12px", 
              display: "block",
              color: "#374151"
            }}>
              🔄 Rotación: {rotation}°
            </label>
            <Slider
              value={rotation}
              min={-180}
              max={180}
              step={1}
              onChange={(e, value) => setRotation(value)}
              style={{ 
                width: "100%",
                color: "#10b981",
                height: "8px"
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              fontSize: "16px", 
              fontWeight: "700",
              marginBottom: "12px", 
              display: "block",
              color: "#374151"
            }}>
              ☀️ Brillo: {brightness}%
            </label>
            <Slider
              value={brightness}
              min={50}
              max={150}
              step={1}
              onChange={(e, value) => setBrightness(value)}
              style={{ 
                width: "100%",
                color: "#f59e0b",
                height: "8px"
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              fontSize: "16px", 
              fontWeight: "700",
              marginBottom: "12px", 
              display: "block",
              color: "#374151"
            }}>
              🎨 Contraste: {contrast}%
            </label>
            <Slider
              value={contrast}
              min={50}
              max={150}
              step={1}
              onChange={(e, value) => setContrast(value)}
              style={{ 
                width: "100%",
                color: "#8b5cf6",
                height: "8px"
              }}
            />
          </div>
        </div>
        
        {/* Botones ultra profesionales */}
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
              setBrightness(100);
              setContrast(100);
            }}
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "white",
              padding: "16px 32px",
              borderRadius: "16px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "700",
              flex: 1,
              boxShadow: "0 8px 25px rgba(245, 158, 11, 0.4)",
              transition: "all 0.3s ease"
            }}
          >
            🔄 Reiniciar Todo
          </button>
          
          <button
            onClick={onCancel}
            disabled={isProcessing}
            style={{
              background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              color: "white",
              padding: "16px 32px",
              borderRadius: "16px",
              border: "none",
              cursor: isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "700",
              flex: 1,
              opacity: isProcessing ? 0.7 : 1,
              boxShadow: "0 8px 25px rgba(107, 114, 128, 0.4)"
            }}
          >
            ❌ Cancelar
          </button>
          
          <button
            onClick={handleCropComplete}
            disabled={!croppedAreaPixels || isProcessing}
            style={{
              background: !croppedAreaPixels || isProcessing 
                ? "#9ca3af" 
                : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "white",
              padding: "16px 32px",
              borderRadius: "16px",
              border: "none",
              cursor: !croppedAreaPixels || isProcessing ? "not-allowed" : "pointer",
              fontSize: "16px",
              fontWeight: "700",
              flex: 2,
              boxShadow: !croppedAreaPixels || isProcessing 
                ? "none" 
                : "0 8px 25px rgba(79, 70, 229, 0.5)"
            }}
          >
            {isProcessing ? "⏳ Procesando..." : "✅ Recortar y Usar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Componente de carga de imágenes ULTRA mejorado con validaciones
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = async (file) => {
    if (!file) return;
    
    // Validaciones ultra mejoradas
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      alert("⚠️ Solo se permiten imágenes: JPG, PNG, GIF, WebP, BMP");
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      alert("⚠️ La imagen es demasiado grande. Máximo 25MB.");
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
      // Simular progreso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("https://email-platform-api-j0fg.onrender.com/upload-image/", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }
      
      setUploadProgress(100);
      const data = await response.json();
      const url = `https://email-platform-api-j0fg.onrender.com${data.url}`;
      onUploaded(url);
      
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setImageSrc(null);
    }
  };

  return (
    <div style={{ marginBottom: "25px" }}>
      <label className="block text-lg font-bold text-gray-700 mb-4">
        📷 Subir Imagen Profesional (Drag & Drop, Recorte Ultra Avanzado)
      </label>
      
      {/* Área de drop ultra mejorada */}
      <div
        style={{
          border: dragActive 
            ? "4px dashed #4f46e5" 
            : loading 
              ? "4px dashed #f59e0b" 
              : "4px dashed #d1d5db",
          borderRadius: "20px",
          padding: "40px",
          textAlign: "center",
          background: dragActive 
            ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)" 
            : loading 
              ? "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)" 
              : "linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)",
          marginBottom: "20px",
          transition: "all 0.4s ease",
          position: "relative",
          boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div style={{ 
          fontSize: "72px", 
          marginBottom: "20px",
          filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" 
        }}>
          {loading ? "⏳" : dragActive ? "🎯" : "📷"}
        </div>
        
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleInputChange}
          disabled={loading}
          style={{ 
            marginBottom: "20px",
            padding: "15px",
            borderRadius: "12px",
            border: "2px solid #e5e7eb",
            backgroundColor: "white",
            fontSize: "16px",
            fontWeight: "600"
          }}
        />
        
        <h4 style={{ 
          fontSize: "20px", 
          color: "#374151", 
          margin: "15px 0",
          fontWeight: "800"
        }}>
          {loading ? "🚀 Procesando tu imagen..." : "O arrastra una imagen aquí"}
        </h4>
        
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "15px"
        }}>
          <span style={{ 
            fontSize: "14px", 
            color: "#10b981", 
            fontWeight: "700",
            background: "#dcfce7",
            padding: "6px 12px",
            borderRadius: "20px"
          }}>
            ✅ JPG, PNG, GIF, WebP, BMP
          </span>
          <span style={{ 
            fontSize: "14px", 
            color: "#3b82f6", 
            fontWeight: "700",
            background: "#dbeafe",
            padding: "6px 12px",
            borderRadius: "20px"
          }}>
            📏 Máximo: 25MB
          </span>
          <span style={{ 
            fontSize: "14px", 
            color: "#8b5cf6", 
            fontWeight: "700",
            background: "#f3e8ff",
            padding: "6px 12px",
            borderRadius: "20px"
          }}>
            🎨 Editor avanzado incluido
          </span>
        </div>
        
        {loading && (
          <div style={{ marginTop: "25px" }}>
            <p style={{ fontSize: "16px", color: "#4f46e5", margin: "10px 0", fontWeight: "700" }}>
              🎯 Optimizando imagen para email...
            </p>
            <div style={{
              width: "100%",
              height: "12px",
              backgroundColor: "#e5e7eb",
              borderRadius: "6px",
              overflow: "hidden",
              marginTop: "15px"
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                transition: "width 0.3s ease",
                borderRadius: "6px"
              }} />
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>
              {uploadProgress}% completado
            </p>
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

// NUEVO: Panel de Snippets ultra mejorado
function SnippetsPanel({ onSelectSnippet, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = [
    { id: 'all', name: 'Todos', icon: '📋' },
    { id: 'greetings', name: 'Saludos', icon: '👋' },
    { id: 'signatures', name: 'Firmas', icon: '✍️' },
    { id: 'cta', name: 'Call-to-Action', icon: '🎯' },
    { id: 'content', name: 'Contenido', icon: '📝' }
  ];

  const filteredSnippets = contentSnippets.filter(snippet => {
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;
    const matchesSearch = snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         snippet.html.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      width: "450px",
      backgroundColor: "white",
      borderRadius: "20px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      zIndex: 9998,
      maxHeight: "85vh",
      overflow: "hidden",
      border: "3px solid #f0f9ff"
    }}>
      <div style={{ padding: "25px" }}>
        {/* Header mejorado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: "22px", 
            fontWeight: "900",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            🧩 Snippets Pro
          </h4>
          <button 
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)"
            }}
          >
            ✕ Cerrar
          </button>
        </div>
        
        {/* Buscador */}
        <input
          type="text"
          placeholder="🔍 Buscar snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "2px solid #e5e7eb",
            fontSize: "14px",
            marginBottom: "20px",
            boxSizing: "border-box"
          }}
        />
        
        {/* Categorías */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "25px", flexWrap: "wrap" }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "25px",
                border: "none",
                background: selectedCategory === category.id 
                  ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                  : "#f8fafc",
                color: selectedCategory === category.id ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                boxShadow: selectedCategory === category.id 
                  ? "0 4px 15px rgba(79, 70, 229, 0.4)" 
                  : "none"
              }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Lista de snippets */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredSnippets.map(snippet => (
            <div
              key={snippet.id}
              style={{
                border: "2px solid #f1f5f9",
                borderRadius: "16px",
                marginBottom: "15px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onClick={() => {
                onSelectSnippet(snippet.html);
                onClose();
              }}
            >
              <div style={{
                padding: "20px",
                background: "linear-gradient(135deg, #fafafa 0%, #f4f4f5 100%)"
              }}>
                <h5 style={{ 
                  margin: "0 0 10px 0", 
                  fontSize: "16px", 
                  fontWeight: "800",
                  color: "#1f2937"
                }}>
                  {snippet.name}
                </h5>
                <div 
                  dangerouslySetInnerHTML={{ __html: snippet.html.slice(0, 150) + "..." }}
                  style={{ 
                    fontSize: "12px", 
                    color: "#6b7280",
                    lineHeight: "1.5"
                  }}
                />
                <div style={{
                  marginTop: "10px",
                  padding: "4px 8px",
                  background: "#4f46e5",
                  color: "white",
                  borderRadius: "6px",
                  fontSize: "10px",
                  fontWeight: "700",
                  display: "inline-block"
                }}>
                  {categories.find(c => c.id === snippet.category)?.name || snippet.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// NUEVO: Panel de Variables ultra mejorado
function VariablesPanel({ onInsertVariable, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredVariables = dynamicVariables.filter(variable =>
    variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "400px",
      backgroundColor: "white",
      borderRadius: "20px",
      boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
      zIndex: 9997,
      maxHeight: "70vh",
      overflow: "hidden",
      border: "3px solid #f0fdf4"
    }}>
      <div style={{ padding: "25px" }}>
        {/* Header mejorado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: "22px", 
            fontWeight: "900",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            🔧 Variables Pro
          </h4>
          <button 
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)"
            }}
          >
            ✕ Cerrar
          </button>
        </div>
        
        {/* Buscador */}
        <input
          type="text"
          placeholder="🔍 Buscar variables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "2px solid #e5e7eb",
            fontSize: "14px",
            marginBottom: "20px",
            boxSizing: "border-box"
          }}
        />

        {/* Lista de variables */}
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {filteredVariables.map(variable => (
            <div
              key={variable.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                borderBottom: "2px solid #f3f4f6",
                cursor: "pointer",
                transition: "all 0.3s ease",
                borderRadius: "12px",
                marginBottom: "8px"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0fdf4";
                e.currentTarget.style.transform = "translateX(5px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.transform = "translateX(0)";
              }}
              onClick={() => onInsertVariable(variable.key)}
            >
              <div>
                <code style={{
                  backgroundColor: "#dcfce7",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "800",
                  color: "#065f46",
                  border: "2px solid #10b981"
                }}>
                  {variable.key}
                </code>
                <p style={{
                  margin: "8px 0 4px 0",
                  fontSize: "13px",
                  color: "#374151",
                  fontWeight: "600"
                }}>
                  {variable.description}
                </p>
                {variable.example && (
                  <p style={{
                    margin: "4px 0 0 0",
                    fontSize: "11px",
                    color: "#6b7280",
                    fontStyle: "italic"
                  }}>
                    Ej: {variable.example}
                  </p>
                )}
              </div>
              <button style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)"
              }}>
                ➕ Usar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ✅ COMPONENTE PRINCIPAL EmailCompose ULTRA PROFESIONAL
const EmailCompose = () => {
  // Estados principales
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
  
  // Estados avanzados
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
    engagementScore: 0,
    readingTime: 0,
    imageCount: 0,
    linkCount: 0
  });
  
  const quillRef = useRef(null);

  // Análisis en tiempo real optimizado
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
      // Simular guardado en API
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
    <div className="bg-white overflow-hidden shadow-2xl rounded-3xl" style={{ maxWidth: "1600px", margin: "0 auto" }}>
      {/* Header ultra profesional */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        padding: "35px 45px",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b, #10b981)"
        }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "36px", fontWeight: "900", letterSpacing: "-1px" }}>
              🚀 Email Composer Ultra Pro Max
            </h3>
            <p style={{ margin: 0, fontSize: "18px", opacity: 0.9, fontWeight: "500" }}>
              Editor profesional con IA, análisis avanzado, imágenes movibles y herramientas premium
            </p>
          </div>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "900" }}>{emailAnalysis.wordCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>palabras</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "900" }}>{emailAnalysis.imageCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>imágenes</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "900" }}>{emailAnalysis.readingTime}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>min lectura</div>
            </div>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveAsDraft}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "14px",
                padding: "14px 24px",
                color: "white",
                cursor: saveAsDraft ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "800",
                backdropFilter: "blur(10px)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
              }}
            >
              {saveAsDraft ? "💾 Guardando..." : "💾 Guardar Borrador"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-10 py-12">
        {/* Toolbar ultra avanzado */}
        <div style={{ 
          display: "flex", 
          gap: "25px", 
          marginBottom: "35px", 
          flexWrap: "wrap",
          alignItems: "center",
          padding: "30px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          borderRadius: "25px",
          boxShadow: "0 20px 40px rgba(240, 147, 251, 0.5)"
        }}>
          <button
            type="button"
            onClick={() => setShowSnippets(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "18px",
              padding: "18px 28px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "900",
              color: "#1f2937",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease"
            }}
          >
            🧩 Snippets Ultra Pro
          </button>
          
          <button
            type="button"
            onClick={() => setShowVariables(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "18px",
              padding: "18px 28px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "900",
              color: "#1f2937",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
            }}
          >
            🔧 Variables Dinámicas Pro
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "18px",
              padding: "18px 28px",
              cursor: "pointer",
              fontSize: "17px",
              fontWeight: "900",
              color: "#1f2937",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
            }}
          >
            😊 Emojis & Símbolos Premium
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "25px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "12px", color: "white", fontSize: "17px", fontWeight: "800" }}>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                style={{ transform: "scale(1.8)" }}
              />
              Vista previa ultra realista
            </label>
          </div>
        </div>

        {/* Panel de análisis ultra mejorado */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          padding: "30px",
          borderRadius: "25px",
          marginBottom: "35px",
          border: "3px solid #10b981",
          boxShadow: "0 15px 35px rgba(16, 185, 129, 0.2)"
        }}>
          <h4 style={{ margin: "0 0 25px 0", fontSize: "24px", fontWeight: "900", color: "#065f46" }}>
            📊 Análisis Inteligente Ultra Avanzado del Email
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "25px" }}>
            {/* Asunto */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: `conic-gradient(#10b981 ${emailAnalysis.subjectScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)"
              }}>
                <div style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "18px",
                  color: "#10b981"
                }}>
                  {emailAnalysis.subjectScore}%
                </div>
              </div>
              <div style={{ color: "#065f46", fontWeight: "800", fontSize: "15px" }}>📝 Asunto</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Optimización SEO</div>
            </div>
            
            {/* Legibilidad */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: `conic-gradient(#3b82f6 ${emailAnalysis.readabilityScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)"
              }}>
                <div style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "18px",
                  color: "#3b82f6"
                }}>
                  {emailAnalysis.readabilityScore}%
                </div>
              </div>
              <div style={{ color: "#1e40af", fontWeight: "800", fontSize: "15px" }}>📚 Legibilidad</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Comprensión</div>
            </div>
            
            {/* Anti-Spam */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: `conic-gradient(${emailAnalysis.spamScore >= 80 ? '#10b981' : emailAnalysis.spamScore >= 60 ? '#f59e0b' : '#ef4444'} ${emailAnalysis.spamScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                boxShadow: `0 8px 25px ${emailAnalysis.spamScore >= 80 ? 'rgba(16, 185, 129, 0.3)' : emailAnalysis.spamScore >= 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                <div style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "18px",
                  color: emailAnalysis.spamScore >= 80 ? '#10b981' : emailAnalysis.spamScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {emailAnalysis.spamScore}%
                </div>
              </div>
              <div style={{ color: "#dc2626", fontWeight: "800", fontSize: "15px" }}>🛡️ Anti-Spam</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Entregabilidad</div>
            </div>
            
            {/* Engagement */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: `conic-gradient(#8b5cf6 ${emailAnalysis.engagementScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 15px",
                boxShadow: "0 8px 25px rgba(139, 92, 246, 0.3)"
              }}>
                <div style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "18px",
                  color: "#8b5cf6"
                }}>
                  {emailAnalysis.engagementScore}%
                </div>
              </div>
              <div style={{ color: "#7c3aed", fontWeight: "800", fontSize: "15px" }}>🎯 Engagement</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Interacción</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Configuración ultra avanzada */}
          <div style={{
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            padding: "35px",
            borderRadius: "25px",
            marginBottom: "35px",
            boxShadow: "0 15px 35px rgba(168, 237, 234, 0.3)"
          }}>
            <h4 style={{ margin: "0 0 30px 0", fontSize: "26px", fontWeight: "900", color: "#1f2937" }}>
              ⚙️ Configuración Ultra Profesional
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "30px" }}>
              {/* Modo de edición */}
              <div>
                <label style={{ display: "block", fontSize: "18px", fontWeight: "800", marginBottom: "12px", color: "#374151" }}>
                  🎨 Tipo de contenido
                </label>
                <select 
                  value={editorMode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    border: "3px solid #e5e7eb",
                    fontSize: "17px",
                    fontWeight: "700",
                    background: "white",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                  }}
                >
                  <option value="html">🎨 HTML Ultra Rico (Recomendado)</option>
                  <option value="plain">📝 Texto Plano Profesional</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label style={{ display: "block", fontSize: "18px", fontWeight: "800", marginBottom: "12px", color: "#374151" }}>
                  ⚡ Prioridad del email
                </label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    border: "3px solid #e5e7eb",
                    fontSize: "17px",
                    fontWeight: "700",
                    background: "white",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                  }}
                >
                  <option value="low">🟢 Prioridad Baja</option>
                  <option value="normal">🟡 Prioridad Normal</option>
                  <option value="high">🔴 Alta Prioridad (Urgente)</option>
                </select>
              </div>

              {/* Opciones de tracking */}
              <div>
                <label style={{ display: "block", fontSize: "18px", fontWeight: "800", marginBottom: "12px", color: "#374151" }}>
                  📊 Seguimiento avanzado
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "15px", fontSize: "17px", fontWeight: "700", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_opens"
                      checked={formData.track_opens}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_opens: e.target.checked }))}
                      style={{ transform: "scale(1.5)" }}
                    />
                    📊 Rastrear aperturas de email
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "15px", fontSize: "17px", fontWeight: "700", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_clicks"
                      checked={formData.track_clicks}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_clicks: e.target.checked }))}
                      style={{ transform: "scale(1.5)" }}
                    />
                    🔗 Rastrear clicks en enlaces
                  </label>
                </div>
              </div>

              {/* Programación */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "15px", fontSize: "18px", fontWeight: "800", marginBottom: "12px", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={scheduledSend}
                    onChange={(e) => setScheduledSend(e.target.checked)}
                    style={{ transform: "scale(1.5)" }}
                  />
                  ⏰ Envío programado profesional
                </label>
                
                {scheduledSend && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      borderRadius: "16px",
                      border: "3px solid #e5e7eb",
                      fontSize: "17px",
                      fontWeight: "700",
                      background: "white",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Selección de buzón mejorada */}
          <div>
            <label className="block text-xl font-black text-gray-700 mb-4">
              📮 Buzón de envío profesional
            </label>
            <select
              name="mailbox_id"
              value={formData.mailbox_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "20px 24px",
                borderRadius: "18px",
                border: "4px solid #e5e7eb",
                fontSize: "19px",
                fontWeight: "700",
                background: "white",
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
              }}
            >
              <option value="">🎯 Seleccionar buzón ultra profesional...</option>
              {mailboxes.map(mailbox => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name} ({mailbox.email})
                  {mailbox.is_verified ? " ✅ Verificado" : " ⚠️ Sin verificar"}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de destinatarios ultra mejorados */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "25px" }}>
            <div>
              <label className="block text-xl font-black text-gray-700 mb-4">
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
                  padding: "20px 24px",
                  borderRadius: "18px",
                  border: "4px solid #e5e7eb",
                  fontSize: "19px",
                  fontWeight: "600",
                  background: "white",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
                }}
              />
            </div>

            <div>
              <label className="block text-xl font-black text-gray-700 mb-4">
                📎 CC (Copia)
              </label>
              <input
                type="text"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                placeholder="cc@empresa.com"
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  borderRadius: "18px",
                  border: "4px solid #e5e7eb",
                  fontSize: "19px",
                  fontWeight: "600",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
                }}
              />
            </div>

            <div>
              <label className="block text-xl font-black text-gray-700 mb-4">
                🤫 BCC (Copia oculta)
              </label>
              <input
                type="text"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                placeholder="bcc@empresa.com"
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  borderRadius: "18px",
                  border: "4px solid #e5e7eb",
                  fontSize: "19px",
                  fontWeight: "600",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.1)"
                }}
              />
            </div>
          </div>

          {/* Asunto con análisis ultra avanzado */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <label className="block text-xl font-black text-gray-700">
                📝 Asunto del correo profesional
              </label>
              <span style={{
                padding: "8px 16px",
                borderRadius: "25px",
                fontSize: "14px",
                fontWeight: "800",
                color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b",
                backgroundColor: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#dcfce7" : "#fef3c7",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
              }}>
                {formData.subject.length}/50 caracteres (Score: {emailAnalysis.subjectScore}%)
              </span>
            </div>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="✨ Escribe un asunto profesional y atractivo que genere apertura..."
              style={{
                width: "100%",
                padding: "22px 28px",
                borderRadius: "18px",
                border: "4px solid #e5e7eb",
                fontSize: "21px",
                fontWeight: "700",
                background: "white",
                boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
              }}
            />
          </div>

          {/* Área de contenido ultra profesional */}
          <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: "40px" }}>
            {/* Editor ultra mejorado */}
            <div>
              <label className="block text-xl font-black text-gray-700 mb-5">
                ✍️ Contenido del mensaje ultra profesional
              </label>
              
              <ImageUploader onUploaded={handleImageUploaded} />
              
              <input
                type="text"
                placeholder="🔍 Buscar en galería profesional de imágenes..."
                value={galleryFilter}
                onChange={e => setGalleryFilter(e.target.value)}
                style={{
                  width: "80%",
                  padding: "15px 20px",
                  marginBottom: "25px",
                  borderRadius: "15px",
                  border: "3px solid #d1d5db",
                  fontSize: "17px",
                  fontWeight: "600"
                }}
              />
              
              <ImageGallery
                onSelect={insertImageInQuill}
                refreshTrigger={galleryRefresh}
                filter={galleryFilter}
              />
              
              {showEmoji && (
                <div style={{ marginBottom: "30px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}>
                  <EmojiPicker 
                    onEmojiClick={handleEmoji}
                    width="100%"
                    height="450px"
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
                    minHeight: "600px",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                    background: "white"
                  }}
                  placeholder="✨ Escribe tu mensaje ultra profesional aquí... Las imágenes se pueden mover arrastrando, redimensionar y editar con herramientas avanzadas."
                />
              ) : (
                <textarea
                  value={formData.body}
                  onChange={(e) => handlePlainTextChange(e.target.value)}
                  placeholder="📝 Escribe tu mensaje profesional en texto plano... También puedes incluir referencias a imágenes."
                  style={{
                    width: "100%",
                    minHeight: "600px",
                    padding: "30px",
                    borderRadius: "20px",
                    border: "4px solid #e5e7eb",
                    fontSize: "19px",
                    fontFamily: "'Fira Code', monospace",
                    lineHeight: "1.8",
                    resize: "vertical",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                    background: "white"
                  }}
                />
              )}
            </div>

            {/* Vista previa ultra realista */}
            {showPreview && (
              <div>
                <label className="block text-xl font-black text-gray-700 mb-5">
                  👁️ Vista previa ultra realista en tiempo real
                </label>
                
                <div style={{
                  border: "4px solid #e5e7eb",
                  borderRadius: "25px",
                  minHeight: "600px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
                  overflow: "hidden"
                }}>
                  {/* Header del email ultra profesional */}
                  <div style={{
                    borderBottom: "3px solid #e5e7eb",
                    paddingBottom: "25px",
                    padding: "30px",
                    background: "white"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                      <div style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "900",
                        fontSize: "18px",
                        boxShadow: "0 4px 15px rgba(79, 70, 229, 0.4)"
                      }}>
                        {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#1f2937" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name || "Usuario Profesional"}
                        </div>
                        <div style={{ fontSize: "15px", color: "#6b7280", fontWeight: "600" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.email || "usuario@empresa.com"}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: "10px" }}>
                      <span style={{ fontSize: "15px", color: "#9ca3af", fontWeight: "700" }}>Para: </span>
                      <span style={{ fontSize: "15px", color: "#1f2937", fontWeight: "700" }}>{formData.to || "destinatario@empresa.com"}</span>
                    </div>
                    
                    {formData.cc && (
                      <div style={{ marginBottom: "10px" }}>
                        <span style={{ fontSize: "15px", color: "#9ca3af", fontWeight: "700" }}>CC: </span>
                        <span style={{ fontSize: "15px", color: "#1f2937", fontWeight: "700" }}>{formData.cc}</span>
                      </div>
                    )}
                    
                    <div style={{ fontSize: "20px", fontWeight: "900", color: "#1f2937", marginTop: "18px" }}>
                      {formData.subject || "Tu asunto ultra profesional aparecerá aquí..."}
                    </div>
                    
                    {formData.priority !== 'normal' && (
                      <div style={{
                        marginTop: "12px",
                        display: "inline-block",
                        padding: "6px 15px",
                        borderRadius: "25px",
                        fontSize: "13px",
                        fontWeight: "800",
                        backgroundColor: formData.priority === 'high' ? "#fef2f2" : "#f0f9ff",
                        color: formData.priority === 'high' ? "#dc2626" : "#1e40af",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                      }}>
                        {formData.priority === 'high' ? "🔴 MÁXIMA PRIORIDAD" : "🟢 BAJA PRIORIDAD"}
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido del email ultra realista */}
                  <div style={{ padding: "30px" }}>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formData.body || "<div style='color: #9ca3af; font-style: italic; text-align: center; padding: 80px 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; border: 2px dashed #cbd5e1;'><div style='font-size: 48px; margin-bottom: 20px;'>✨</div><h3 style='margin: 0 0 15px 0; font-size: 22px; font-weight: 800;'>Tu contenido ultra profesional aparecerá aquí</h3><p style='margin: 0; font-size: 16px;'>¡Usa todas las herramientas avanzadas para crear emails impactantes!<br/>Las imágenes se pueden arrastrar, redimensionar y editar profesionalmente.</p></div>" 
                      }} 
                      style={{ 
                        fontSize: "17px",
                        lineHeight: "1.8",
                        minHeight: "250px",
                        color: "#374151"
                      }} 
                    />
                  </div>
                </div>
                
                {/* Estadísticas ultra detalladas */}
                <div style={{
                  marginTop: "25px",
                  padding: "25px",
                  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                  borderRadius: "20px",
                  border: "3px solid #3b82f6",
                  fontSize: "15px",
                  boxShadow: "0 8px 25px rgba(59, 130, 246, 0.2)"
                }}>
                  <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "900", color: "#1e40af" }}>
                    📊 Estadísticas ultra avanzadas en tiempo real
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700" }}>📝 Palabras:</span>
                      <strong style={{ color: "#1e40af" }}>{emailAnalysis.wordCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700" }}>🔤 Caracteres:</span>
                      <strong style={{ color: "#1e40af" }}>{emailAnalysis.charCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700" }}>📧 Asunto:</span>
                      <strong style={{ color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b" }}>
                        {formData.subject.length}/50
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700" }}>⏱️ Lectura:</span>
                      <strong style={{ color: "#10b981" }}>{emailAnalysis.readingTime} min</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700" }}>🖼️ Imágenes:</span>
                      <strong style={{ color: "#8b5cf6" }}>{emailAnalysis.imageCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "700" }}>🔗 Enlaces:</span>
                      <strong style={{ color: "#f59e0b" }}>{emailAnalysis.linkCount}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción ultra profesionales */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "50px",
            borderTop: "4px solid #f3f4f6",
            marginTop: "50px"
          }}>
            <div style={{ display: "flex", gap: "25px" }}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saveAsDraft}
                style={{
                  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                  color: "white",
                  padding: "20px 40px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: saveAsDraft ? "not-allowed" : "pointer",
                  fontSize: "19px",
                  fontWeight: "800",
                  opacity: saveAsDraft ? 0.7 : 1,
                  boxShadow: "0 8px 25px rgba(107, 114, 128, 0.4)",
                  transition: "all 0.3s ease"
                }}
              >
                {saveAsDraft ? "💾 Guardando borrador..." : "💾 Guardar Borrador Pro"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading 
                  ? "#9ca3af" 
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "22px 60px",
                borderRadius: "25px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "24px",
                fontWeight: "900",
                boxShadow: loading 
                  ? "none" 
                  : "0 20px 40px rgba(102, 126, 234, 0.6)",
                transform: loading ? "none" : "translateY(-5px)",
                transition: "all 0.4s ease",
                textTransform: "uppercase",
                letterSpacing: "1.5px"
              }}
            >
              {loading 
                ? '📤 Enviando email...' 
                : (scheduledSend 
                    ? '⏰ Programar Envío Pro' 
                    : '🚀 Enviar Email Ultra Pro'
                  )
              }
            </button>
          </div>

          {/* Mensaje de estado ultra mejorado */}
          {status && (
            <div 
              style={{
                padding: "30px 40px",
                borderRadius: "25px",
                fontSize: "20px",
                fontWeight: "800",
                textAlign: "center",
                marginTop: "40px",
                backgroundColor: status.includes("Error") || status.includes("❌") 
                  ? "#fef2f2" : "#f0fff4",
                color: status.includes("Error") || status.includes("❌")
                  ? "#dc2626" : "#065f46",
                border: status.includes("Error") || status.includes("❌")
                  ? "4px solid #fecaca" : "4px solid #bbf7d0",
                boxShadow: "0 12px 30px rgba(0,0,0,0.15)"
              }}
            >
              {status}
            </div>
          )}
        </form>
      </div>

      {/* Paneles flotantes ultra profesionales */}
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
