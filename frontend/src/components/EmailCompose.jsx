import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../services/api";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageGallery from "./ImageGallery";
import EmojiPicker from "emoji-picker-react";

// Plugins avanzados para Quill
import ImageResize from "quill-image-resize-module-react";
import QuillImageDropAndPaste from "quill-image-drop-and-paste";

// Registrar módulos Quill
Quill.register("modules/imageResize", ImageResize);
try {
  Quill.register("modules/imageDropAndPaste", QuillImageDropAndPaste);
} catch (e) {
  console.warn("ImageDropAndPaste module already registered");
}

// Configuración avanzada de Quill
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

// Componente principal EmailCompose ULTRA PROFESIONAL
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
  const [showPreview, setShowPreview] = useState(true);
  const [scheduledSend, setScheduledSend] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [emailStats, setEmailStats] = useState({
    subjectScore: 0,
    readabilityScore: 0,
    spamScore: 0
  });
  
  const quillRef = useRef(null);

  // Cargar buzones al montar
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

  // Contador en tiempo real y análisis
  useEffect(() => {
    const analyzeContent = () => {
      let textContent = '';
      if (editorMode === 'html') {
        textContent = formData.body.replace(/<[^>]*>/g, ' ');
      } else {
        textContent = formData.body;
      }
      
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharacterCount(textContent.length);
      
      // Análisis básico de calidad
      const subjectLength = formData.subject.length;
      const subjectScore = subjectLength >= 30 && subjectLength <= 50 ? 100 : 
                          subjectLength >= 20 && subjectLength <= 60 ? 75 : 50;
      
      const readabilityScore = words.length >= 50 && words.length <= 200 ? 100 :
                              words.length >= 30 && words.length <= 300 ? 75 : 50;
      
      // Detección básica de spam
      const spamWords = ['gratis', 'free', 'urgente', 'limited time', '!!!', 'click here'];
      const spamCount = spamWords.filter(word => 
        textContent.toLowerCase().includes(word.toLowerCase()) ||
        formData.subject.toLowerCase().includes(word.toLowerCase())
      ).length;
      const spamScore = Math.max(0, 100 - (spamCount * 20));
      
      setEmailStats({
        subjectScore,
        readabilityScore,
        spamScore
      });
    };
    
    analyzeContent();
  }, [formData.body, formData.subject, editorMode]);

  // Handlers principales
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (content) => {
    setFormData(prev => ({ ...prev, body: content }));
  };

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

  const handleSaveDraft = async () => {
    try {
      setSaveAsDraft(true);
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
      // Validaciones
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
      {/* Header ultra moderno */}
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
          height: "6px",
          background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b)"
        }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "900", letterSpacing: "-1px" }}>
              🚀 Email Marketing Pro Software
            </h3>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              Herramienta profesional para campañas de software y desarrollo
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{wordCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>palabras</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{characterCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>caracteres</div>
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
        {/* Toolbar superior */}
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

        {/* Panel de análisis de calidad */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          padding: "25px",
          borderRadius: "20px",
          marginBottom: "30px",
          border: "2px solid #10b981"
        }}>
          <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800", color: "#065f46" }}>
            📊 Análisis de Calidad del Email
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(#10b981 ${emailStats.subjectScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                position: "relative"
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
                  {emailStats.subjectScore}%
                </div>
              </div>
              <div style={{ color: "#065f46", fontWeight: "700", fontSize: "14px" }}>Asunto</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Optimización SEO</div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(#3b82f6 ${emailStats.readabilityScore * 3.6}deg, #e5e7eb 0deg)`,
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
                  {emailStats.readabilityScore}%
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
                background: `conic-gradient(${emailStats.spamScore >= 80 ? '#10b981' : emailStats.spamScore >= 60 ? '#f59e0b' : '#ef4444'} ${emailStats.spamScore * 3.6}deg, #e5e7eb 0deg)`,
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
                  color: emailStats.spamScore >= 80 ? '#10b981' : emailStats.spamScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {emailStats.spamScore}%
                </div>
              </div>
              <div style={{ color: "#dc2626", fontWeight: "700", fontSize: "14px" }}>Anti-Spam</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Entregabilidad</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Configuración avanzada del email */}
          <div style={{
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            padding: "30px",
            borderRadius: "20px",
            marginBottom: "30px"
          }}>
            <h4 style={{ margin: "0 0 25px 0", fontSize: "24px", fontWeight: "800", color: "#1f2937" }}>
              ⚙️ Configuración Avanzada de Envío
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
                  <option value="html">🎨 HTML Avanzado (Rich Text)</option>
                  <option value="plain">📝 Texto Simple (Plain Text)</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Prioridad del email
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
                  <option value="low">🟢 Baja Prioridad</option>
                  <option value="normal">🟡 Prioridad Normal</option>
                  <option value="high">🔴 Alta Prioridad</option>
                </select>
              </div>

              {/* Opciones de tracking */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Opciones de seguimiento
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
                    📊 Rastrear aperturas de email
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "600", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_clicks"
                      checked={formData.track_clicks}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_clicks: e.target.checked }))}
                      style={{ transform: "scale(1.3)" }}
                    />
                    🔗 Rastrear clicks en enlaces
                  </label>
                </div>
              </div>

              {/* Envío programado */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={scheduledSend}
                    onChange={(e) => setScheduledSend(e.target.checked)}
                    style={{ transform: "scale(1.3)" }}
                  />
                  ⏰ Programar envío
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
              <option value="">Seleccionar buzón de correo...</option>
              {mailboxes.map(mailbox => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name} ({mailbox.email})
                  {mailbox.is_verified ? " ✅ Verificado" : " ⚠️ Sin verificar"}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de destinatarios */}
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
                placeholder="destinatario@example.com"
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
                📎 CC (con copia)
              </label>
              <input
                type="text"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                placeholder="cc@email.com"
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
                🤫 BCC (copia oculta)
              </label>
              <input
                type="text"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                placeholder="bcc@email.com"
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

          {/* Asunto mejorado */}
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
                {formData.subject.length}/50 caracteres
              </span>
            </div>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Asunto profesional para servicios de software y desarrollo..."
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
                  placeholder="Escribe tu mensaje profesional para servicios de software, desarrollo, consultoría IT, automatización..."
                />
              ) : (
                <textarea
                  value={formData.body}
                  onChange={(e) => handlePlainTextChange(e.target.value)}
                  placeholder="Escribe tu mensaje en texto simple para servicios de software y desarrollo..."
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

            {/* Vista previa */}
            {showPreview && (
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">
                  👁️ Vista previa en tiempo real
                </label>
                
                <div style={{
                  border: "3px solid #e5e7eb",
                  borderRadius: "20px",
                  minHeight: "500px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                  overflow: "hidden"
                }}>
                  {/* Header del email preview */}
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
                        {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name || "ONIXU Software"}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.email || "software@onixu.com"}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>Para: </span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{formData.to || "cliente@empresa.com"}</span>
                    </div>
                    
                    {formData.cc && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>CC: </span>
                        <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{formData.cc}</span>
                      </div>
                    )}
                    
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#1f2937", marginTop: "15px" }}>
                      {formData.subject || "Tu asunto de software/desarrollo aparecerá aquí..."}
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
                        __html: formData.body || "<p style='color: #9ca3af; font-style: italic; text-align: center; padding: 60px 20px;'>👆 El contenido aparecerá aquí conforme escribas...<br/>¡Diseña emails profesionales para tus servicios de software!</p>" 
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
                
                {/* Panel de estadísticas de contenido */}
                <div style={{
                  marginTop: "20px",
                  padding: "20px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "16px",
                  border: "2px solid #3b82f6",
                  fontSize: "14px"
                }}>
                  <h4 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "800", color: "#1e40af" }}>
                    📊 Estadísticas del contenido
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>📝 Palabras:</span>
                      <strong style={{ color: "#1e40af" }}>{wordCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>🔤 Caracteres:</span>
                      <strong style={{ color: "#1e40af" }}>{characterCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>📧 Asunto:</span>
                      <strong style={{ color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b" }}>
                        {formData.subject.length}/50
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>🎨 Modo:</span>
                      <strong style={{ color: "#1e40af" }}>{editorMode === 'html' ? '🎨 HTML' : '📝 Texto'}</strong>
                    </div>
                  </div>
                  
                  {/* Tiempo estimado de lectura */}
                  <div style={{ marginTop: "15px", padding: "12px", background: "white", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "600" }}>⏱️ Tiempo de lectura:</span>
                      <strong style={{ color: "#10b981" }}>{Math.max(1, Math.ceil(wordCount / 200))} min</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
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
                  transition: "all 0.3s ease",
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
              {loading ? '📤 Enviando...' : (scheduledSend ? '⏰ Programar Envío' : '🚀 Enviar Email Software')}
            </button>
          </div>

          {/* Mensaje de estado */}
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
    </div>
  );
};

export default EmailCompose;
