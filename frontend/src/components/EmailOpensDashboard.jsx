import React, { useEffect, useState } from "react";
import axios from "axios";

const EmailOpensDashboard = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ajusta la URL según tu configuración
    axios.get("/emails/history?limit=100")
      .then((res) => {
        setEmails(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Seguimiento de Correos Enviados</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Destinatario</th>
              <th>Asunto</th>
              <th>Fecha de Envío</th>
              <th>Estado</th>
              <th>Apertura</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id}>
                <td>{e.to_email}</td>
                <td>{e.subject}</td>
                <td>{e.created_at?.split("T")[0]}</td>
                <td>
                  {e.status === "sent" ? "✅ Enviado" : "❌ Fallido"}
                </td>
                <td>
                  {e.opened_at
                    ? (
                        <span style={{ color: "green" }}>
                          Abierto {e.opened_at.split("T")[0]}
                        </span>
                      )
                    : (
                        <span style={{ color: "red" }}>
                          No abierto
                        </span>
                      )
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EmailOpensDashboard;
