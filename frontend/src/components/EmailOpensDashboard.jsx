import React, { useEffect, useState } from "react";
import api from "../services/api"; // ✅ Usar el servicio configurado

function exportToCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map(row => keys.map(k => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const EmailOpensDashboard = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // ✅ Función para cargar emails corregida
  const loadEmails = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log("🔍 Cargando historial de emails...");
      
      // ✅ Usar el servicio api configurado con autenticación
      const response = await api.get('/emails/history', {
        params: {
          limit: 100,
          offset: 0
        }
      });
      
      console.log("📨 Respuesta del servidor:", response.data);
      
      // ✅ Manejar la respuesta directa (es un array según tu backend)
      if (Array.isArray(response.data)) {
        setEmails(response.data);
        console.log(`✅ ${response.data.length} emails cargados`);
      } else {
        console.warn("⚠️ Respuesta no es un array:", response.data);
        setEmails([]);
      }
      
    } catch (err) {
      console.error("❌ Error cargando emails:", err);
      setError('Error al cargar el historial de correos: ' + (err.response?.data?.detail || err.message));
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  // ✅ Función para refrescar datos
  const handleRefresh = () => {
    loadEmails();
  };

  // Filtrar y ordenar
  let shownEmails = emails.filter(e => {
    if (search && !(
      (e.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.to_email || "").toLowerCase().includes(search.toLowerCase())
    )) return false;
    
    if (filter === "opened") return !!e.opened_at;
    if (filter === "not_opened") return !e.opened_at;
    if (filter === "sent") return e.status === "sent";
    if (filter === "failed") return e.status === "failed";
    return true;
  });

  shownEmails = [...shownEmails].sort((a, b) => {
    const vA = a[sortBy] || "";
    const vB = b[sortBy] || "";
    if (sortOrder === "asc") return vA > vB ? 1 : vA < vB ? -1 : 0;
    else return vA < vB ? 1 : vA > vB ? -1 : 0;
  });

  return (
    <div style={{ padding: 20, maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header con botones */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap", 
        gap: 12, 
        marginBottom: 20 
      }}>
        <h2 style={{ margin: 0 }}>📬 Seguimiento de Correos Enviados</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{ 
              background: "#10b981", 
              color: "#fff", 
              border: "none", 
              padding: "8px 16px", 
              borderRadius: 6, 
              cursor: loading ? "not-allowed" : "pointer", 
              fontWeight: 600,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "🔄 Actualizando..." : "🔄 Actualizar"}
          </button>
          <button
            onClick={() => exportToCSV(shownEmails, "emails_history.csv")}
            disabled={shownEmails.length === 0}
            style={{ 
              background: "#4338ca", 
              color: "#fff", 
              border: "none", 
              padding: "8px 16px", 
              borderRadius: 6, 
              cursor: shownEmails.length === 0 ? "not-allowed" : "pointer", 
              fontWeight: 600,
              opacity: shownEmails.length === 0 ? 0.5 : 1
            }}
          >
            📊 Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros mejorados */}
      <div style={{ 
        display: "flex", 
        gap: 12, 
        flexWrap: "wrap", 
        marginBottom: 20,
        padding: "16px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px"
      }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar destinatario o asunto"
          style={{ 
            flex: 1, 
            minWidth: 250, 
            padding: "8px 12px", 
            borderRadius: 6, 
            border: "1px solid #d1d5db",
            fontSize: "14px"
          }}
        />
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value)} 
          style={{ 
            padding: "8px 12px", 
            borderRadius: 6, 
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            fontSize: "14px"
          }}
        >
          <option value="all">📋 Todos</option>
          <option value="sent">✅ Solo enviados</option>
          <option value="failed">❌ Solo fallidos</option>
          <option value="opened">👀 Solo abiertos</option>
          <option value="not_opened">📪 No abiertos</option>
        </select>
        <select 
          value={sortBy} 
          onChange={e => setSortBy(e.target.value)} 
          style={{ 
            padding: "8px 12px", 
            borderRadius: 6, 
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            fontSize: "14px"
          }}
        >
          <option value="created_at">📅 Fecha de Envío</option>
          <option value="to_email">👤 Destinatario</option>
          <option value="subject">📝 Asunto</option>
          <option value="opened_at">👁️ Fecha Apertura</option>
        </select>
        <select 
          value={sortOrder} 
          onChange={e => setSortOrder(e.target.value)} 
          style={{ 
            padding: "8px 12px", 
            borderRadius: 6, 
            border: "1px solid #d1d5db",
            backgroundColor: "white",
            fontSize: "14px"
          }}
        >
          <option value="desc">⬇️ Descendente</option>
          <option value="asc">⬆️ Ascendente</option>
        </select>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          border: "1px solid #f87171",
          color: "#dc2626",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "16px"
        }}>
          ❌ {error}
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div style={{ 
          textAlign: "center", 
          fontSize: 18, 
          padding: "60px 0",
          color: "#6b7280"
        }}>
          <div>🔄 Cargando historial de correos...</div>
        </div>
      ) : (
        <>
          {shownEmails.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              color: "#6b7280", 
              padding: "60px 0", 
              fontSize: 18,
              backgroundColor: "#f9fafb",
              borderRadius: "12px",
              border: "2px dashed #d1d5db"
            }}>
              {emails.length === 0 ? (
                <>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <div style={{ marginBottom: "8px" }}>No hay correos enviados aún</div>
                  <div style={{ fontSize: "14px" }}>Los correos aparecerán aquí después de enviarlos</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
                  <div>No se encontraron correos con los filtros aplicados</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                overflow: "hidden"
              }}>
                <thead>
                  <tr style={{ background: "#4338ca", color: "white" }}>
                    <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>👤 Destinatario</th>
                    <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📝 Asunto</th>
                    <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📅 Fecha Envío</th>
                    <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📊 Estado</th>
                    <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>👁️ Apertura</th>
                  </tr>
                </thead>
                <tbody>
                  {shownEmails.map((email, index) => (
                    <tr 
                      key={email.id} 
                      style={{ 
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb"
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: 500 }}>
                        {email.to_email}
                      </td>
                      <td style={{ padding: "12px", maxWidth: "200px" }}>
                        <div style={{ 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap" 
                        }}>
                          {email.subject}
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                        {email.created_at ? new Date(email.created_at).toLocaleString('es-ES') : ""}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          color: email.status === "sent" ? "#059669" : "#dc2626",
                          fontWeight: 600,
                          fontSize: "14px"
                        }}>
                          {email.status === "sent" ? "✅ Enviado" : "❌ Fallido"}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {email.opened_at ? (
                          <span style={{ 
                            color: "#0ea5e9", 
                            fontWeight: 600,
                            fontSize: "14px"
                          }}>
                            👀 {new Date(email.opened_at).toLocaleString('es-ES')}
                          </span>
                        ) : (
                          <span style={{ 
                            color: "#9ca3af", 
                            fontWeight: 500,
                            fontSize: "14px"
                          }}>
                            📪 No abierto
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Estadísticas */}
              <div style={{ 
                marginTop: "16px", 
                padding: "12px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#6b7280"
              }}>
                📊 Mostrando {shownEmails.length} de {emails.length} correos | 
                ✅ Enviados: {emails.filter(e => e.status === "sent").length} | 
                👀 Abiertos: {emails.filter(e => e.opened_at).length} | 
                📪 No abiertos: {emails.filter(e => e.status === "sent" && !e.opened_at).length}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailOpensDashboard;
