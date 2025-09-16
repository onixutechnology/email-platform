import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageGallery from "./ImageGallery";
import Cropper from 'react-easy-crop';

// ------ Plugins -------
import ImageResize from 'quill-image-resize-module-react';
Quill.register('modules/imageResize', ImageResize);

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }, { font: [] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  imageResize: { modules: ['Resize', 'DisplaySize', 'Toolbar'] }
};

const quillFormats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote',
  'color', 'background', 'align', 'script', 'direction', 'list', 'indent',
  'link', 'image', 'video'
];

// --- Crop Modal --------
function CropModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const getCroppedImg = async () => {
    // Usando canvas para crop real
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise(resolve => (image.onload = resolve));
    const cropCanvas = document.createElement('canvas');
    const ctx = cropCanvas.getContext('2d');
    cropCanvas.width = image.width * zoom;
    cropCanvas.height = image.height * zoom;
    ctx.drawImage(image, -(crop.x * zoom), -(crop.y * zoom));
    return cropCanvas.toDataURL();
  };

  const handleDone = async () => {
    const croppedDataUrl = await getCroppedImg();
    onComplete(croppedDataUrl);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ background: "#fff", padding: 20, borderRadius: 6 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          showGrid={true}
        />
        <div style={{ marginTop: 12 }}>
          <button onClick={handleDone} className="bg-indigo-600 text-white px-4 py-2 rounded mr-2">Recortar y Subir</button>
          <button onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// -------- Componente uploader mejorado con crop modal ---
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview para crop antes de subir
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl) => {
    setLoading(true);
    setShowCrop(false);

    // Convert dataUrl (base64) to Blob for upload
    const res = await fetch(croppedDataUrl);
    const blob = await res.blob();
    const formData = new FormData();
    formData.append("file", new File([blob], "cropped-image.png", { type: blob.type }));

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

  return (
    <div style={{ marginBottom: "12px" }}>
      <label className="block text-sm font-medium text-gray-700">Adjuntar imagen al mensaje (recorte/previsualización disponible)</label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      {loading && <span className="text-xs text-gray-500 ml-2">Subiendo...</span>}
      {showCrop && (
        <CropModal 
          imageSrc={imageSrc}
          onComplete={handleCropComplete}
          onCancel={() => setShowCrop(false)}
        />
      )}
    </div>
  );
}

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuillChange = content => {
    setFormData(prev => ({
      ...prev,
      body: content
    }));
  };

  // Insertar imagen usando API de Quill
  const insertImageInQuill = (imageUrl) => {
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertEmbed(range ? range.index : 0, "image", imageUrl);
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML
    }));
  };

  // Maneja subida de imagen y refresca galería
  const handleImageUploaded = (imageUrl) => {
    insertImageInQuill(imageUrl);
    setGalleryRefresh(val => val + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const emailData = {
        to: formData.to,
        subject: formData.subject,
        body: 'Este correo requiere visualizar HTML.', // Texto plano opcional
        html_body: formData.body,
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
          Redactar Correo
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Buzón de envío
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Destinatario
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Asunto
            </label>
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
              Mensaje HTML con imágenes, crop previo, resize y controles avanzados
            </label>
            <ImageUploader onUploaded={handleImageUploaded} />
            <ImageGallery onSelect={insertImageInQuill} refreshTrigger={galleryRefresh} />
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.body}
              onChange={handleQuillChange}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white"
              style={{ minHeight: "220px" }}
            />
          </div>
          <div className="mt-4 mb-2 p-3 border rounded bg-gray-50">
            <label className="block text-xs font-bold text-gray-400 mb-1">Vista previa mensaje HTML:</label>
            <div dangerouslySetInnerHTML={{ __html: formData.body }} />
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
              status.includes('Error') 
                ? 'bg-red-100 border border-red-400 text-red-700' 
                : 'bg-green-100 border border-green-400 text-green-700'
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
