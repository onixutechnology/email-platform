import React, { useEffect, useState } from "react";
import axios from "axios";

function exportToCSV(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","), // Encabezados
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    axios.get("/emails/history?limit=100")
      .then((res) => {
        let data = res.data;
        if (data && Array.isArray(data.emails)) {
          setEmails(data.emails);
        } else if (Array.isArray(data)) {
          setEmails(data);
        } else {
          setEmails([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setEmails([]);
        setLoading(false);
      });
  }, []);

  // Filtrar y ordenar
  let shownEmails = emails.filter(e => {
    if (search 
      && !(
        (e.subject || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.to_email || "").toLowerCase().includes(search.toLowerCase())
      )
    ) return false;
    if (filter === "opened") return !!e.opened_at;
    if (filter === "not_opened") return !e.opened_at;
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
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Seguimiento de Correos Enviados</h2>
        <button
          onClick={() => exportToCSV(shownEmails, "emails_history.csv")}
          style={{ background: "#4338ca", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
        >
          Exportar CSV
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar destinatario o asunto"
          style={{ flex: 1, minWidth: 220, padding: 8, borderRadius: 6, border: "1px solid #c7d2fe" }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #c7d2fe" }}>
          <option value="all">Todos</option>
          <option value="opened">Solo abiertos</option>
          <option value="not_opened">Solo no abiertos</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #c7d2fe" }}>
          <option value="created_at">Fecha de Envío</option>
          <option value="to_email">Destinatario</option>
          <option value="subject">Asunto</option>
        </select>
        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid #c7d2fe" }}>
          <option value="desc">Descendente</option>
          <option value="asc">Ascendente</option>
        </select>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", fontSize: 18, padding: "40px 0" }}>Cargando...</div>
      ) : (
        <>
          {shownEmails.length === 0 ? (
            <div style={{ textAlign: "center", color: "#555", padding: "40px 0", fontSize: 18 }}>
              No hay correos para mostrar.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                marginBottom: 16
              }}>
                <thead>
                  <tr style={{ background: "#4338ca", color: "white" }}>
                    <th style={{ padding: "10px" }}>Destinatario</th>
                    <th style={{ padding: "10px" }}>Asunto</th>
                    <th style={{ padding: "10px" }}>Fecha de Envío</th>
                    <th style={{ padding: "10px" }}>Estado</th>
                    <th style={{ padding: "10px" }}>Apertura</th>
                  </tr>
                </thead>
                <tbody>
                  {shownEmails.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px", fontWeight: 500 }}>{e.to_email}</td>
                      <td style={{ padding: "10px" }}>{e.subject}</td>
                      <td style={{ padding: "10px" }}>{e.created_at ? e.created_at.split("T")[0] : ""}</td>
                      <td style={{ padding: "10px" }}>
                        <span style={{
                          color: e.status === "sent" ? "#059669" : "#b91c1c",
                          fontWeight: "bold"
                        }}>
                          {e.status === "sent" ? "✅ Enviado" : "❌ Fallido"}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        {e.opened_at
                          ? (
                            <span style={{ color: "#0ea5e9", fontWeight: "bold" }}>
                              Abierto {e.opened_at.split("T")[0]}
                            </span>
                          ) : (
                            <span style={{ color: "#7c3aed", fontWeight: "bold" }}>
                              No abierto
                            </span>
                          )
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ color: "#6b7280" }}>
                Mostrando {shownEmails.length} correo{shownEmails.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailOpensDashboard;
