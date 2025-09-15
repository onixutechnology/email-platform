import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Componente para subir imágenes
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("https://email-platform-api-j0fg.onrender.com/upload-image/", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const url = `https://email-platform-api-j0fg.onrender.com${data.url}`;
      onUploaded(url); // Inserta la imagen en el correo (via Quill)
    } catch (err) {
      alert("Error al subir imagen");
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: "12px" }}>
      <label className="block text-sm font-medium text-gray-700">Adjuntar imagen al mensaje</label>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      {loading && <span className="text-xs text-gray-500 ml-2">Subiendo...</span>}
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
      quillRef.current.getEditor().setContents([]); // Limpia el editor Quill
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
              Mensaje HTML con imágenes adjuntas
            </label>
            <ImageUploader onUploaded={insertImageInQuill} />
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.body}
              onChange={handleQuillChange}
              className="bg-white"
              style={{ minHeight: "150px" }}
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
