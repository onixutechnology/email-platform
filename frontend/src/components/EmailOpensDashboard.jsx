import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../services/api";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement 
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Función para exportar CSV mejorada
function exportToCSV(data, filename) {
  if (!data.length) return;
  
  const headers = [
    "ID", "Destinatario", "Remitente", "Asunto", "Fecha Envío", 
    "Estado", "Fecha Apertura", "Aperturas", "Última Apertura",
    "Dispositivo", "Navegador", "SO", "País", "Ciudad"
  ];
  
  const csvContent = [
    headers.join(","),
    ...data.map(email => [
      email.id,
      `"${email.to_email}"`,
      `"${email.from_email}"`,
      `"${email.subject?.replace(/"/g, '""') || ''}"`,
      email.created_at ? new Date(email.created_at).toLocaleString() : "",
      email.status,
      email.opened_at ? new Date(email.opened_at).toLocaleString() : "",
      email.open_count || 0,
      email.last_opened_at ? new Date(email.last_opened_at).toLocaleString() : "",
      email.tracking_data?.device || "",
      email.tracking_data?.browser || "",
      email.tracking_data?.os || "",
      email.tracking_data?.country || "",
      email.tracking_data?.city || ""
    ].join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Función para exportar JSON
function exportToJSON(data, filename) {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const EmailOpensDashboard = () => {
  // Estados básicos
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de filtros y búsqueda
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateRange, setDateRange] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  
  // Estados de UI
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // table, cards, analytics
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos

  // FUNCION DE CARGA ROBUSTA DE EMAILS
  const loadEmails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/emails/history', {
        params: { limit: 1000, offset: 0 }
      });
      if (Array.isArray(response.data)) {
        setEmails(
          response.data.map(email => ({
            ...email,
            tracking_data: typeof email.tracking_data === 'string'
              ? (() => { try { return JSON.parse(email.tracking_data); } catch { return {}; } })()
              : (email.tracking_data || {}),
          }))
        );
      } else {
        setEmails([]);
      }
    } catch (err) {
      setError('Error al cargar el historial: ' + (err.response?.data?.detail || err.message));
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmails(); }, [loadEmails]);
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadEmails, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadEmails]);


  // Filtros avanzados
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Búsqueda
      if (search) {
        const searchLower = search.toLowerCase();
        if (!(
          (email.subject || "").toLowerCase().includes(searchLower) ||
          (email.to_email || "").toLowerCase().includes(searchLower) ||
          (email.from_email || "").toLowerCase().includes(searchLower)
        )) return false;
      }
      
      // Filtro de estado
      if (filter !== "all") {
        switch (filter) {
          case "opened":
            if (!email.opened_at) return false;
            break;
          case "not_opened":
            if (email.opened_at) return false;
            break;
          case "multiple_opens":
            if ((email.open_count || 0) <= 1) return false;
            break;
          case "sent":
            if (email.status !== "sent") return false;
            break;
          case "failed":
            if (email.status !== "failed") return false;
            break;
        }
      }
      
      // Filtro de dispositivo
      if (deviceFilter !== "all") {
        const td = (typeof email.tracking_data === 'object' && email.tracking_data !== null) ? email.tracking_data : {};
        const isMobile = !!td.is_mobile;
        const isTablet = !!td.is_tablet;
        
        switch (deviceFilter) {
          case "mobile":
            if (!isMobile) return false;
            break;
          case "tablet": 
            if (!isTablet) return false;
            break;
          case "desktop":
            if (isMobile || isTablet) return false;
            break;
        }
      }
      
      // Filtro de fecha
      if (dateRange !== "all") {
        const emailDate = new Date(email.created_at);
        const now = new Date();
        const daysDiff = (now - emailDate) / (1000 * 60 * 60 * 24);
        
        switch (dateRange) {
          case "today":
            if (daysDiff > 1) return false;
            break;
          case "week":
            if (daysDiff > 7) return false;
            break;
          case "month":
            if (daysDiff > 30) return false;
            break;
        }
      }
      
      return true;
    });
  }, [emails, search, filter, deviceFilter, dateRange]);

  // Emails ordenados
  const sortedEmails = useMemo(() => {
    return [...filteredEmails].sort((a, b) => {
      let valA = a[sortBy] || "";
      let valB = b[sortBy] || "";
      
      if (sortBy.includes("at") || sortBy.includes("date")) {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else if (sortBy === "open_count") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }
      
      if (sortOrder === "asc") {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }, [filteredEmails, sortBy, sortOrder]);

  // Paginación
  const paginatedEmails = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEmails.slice(start, start + itemsPerPage);
  }, [sortedEmails, currentPage, itemsPerPage]);

  // Estadísticas avanzadas
  const stats = useMemo(() => {
    const total = emails.length;
    const sent = emails.filter(e => e.status === "sent").length;
    const opened = emails.filter(e => e.opened_at).length;
    const failed = emails.filter(e => e.status === "failed").length;
    const multipleOpens = emails.filter(e => (e.open_count || 0) > 1).length;
    
    // Estadísticas por dispositivo
    const deviceStats = emails.reduce((acc, email) => {
  const td = (typeof email.tracking_data === 'object' && email.tracking_data !== null) ? email.tracking_data : {};
  if (td.is_mobile) acc.mobile++;
  else if (td.is_tablet) acc.tablet++;
  else acc.desktop++;
  return acc;
}, { mobile: 0, tablet: 0, desktop: 0 });

const browserStats = emails.reduce((acc, email) => {
  const td = (typeof email.tracking_data === 'object' && email.tracking_data !== null) ? email.tracking_data : {};
  const browser = td.browser || "Desconocido";
  acc[browser] = (acc[browser] || 0) + 1;
  return acc;
}, {});

    
    return {
      total,
      sent,
      opened,
      failed,
      notOpened: sent - opened,
      multipleOpens,
      openRate: sent > 0 ? (opened / sent * 100).toFixed(2) : 0,
      successRate: total > 0 ? (sent / total * 100).toFixed(2) : 0,
      deviceStats,
      browserStats
    };
  }, [emails]);

  // Datos para gráficos
  const chartData = {
    openRate: {
      labels: ['Abiertos', 'No Abiertos'],
      datasets: [{
        data: [stats.opened, stats.notOpened],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0
      }]
    },
    deviceStats: {
      labels: ['Móvil', 'Tablet', 'Escritorio'],
      datasets: [{
        data: [stats.deviceStats.mobile, stats.deviceStats.tablet, stats.deviceStats.desktop],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4'],
        borderWidth: 0
      }]
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString('es-ES');
    } catch {
      return "-";
    }
  };

  const getOpenStatus = (email) => {
    if (!email.opened_at) return { text: "📪 No abierto", color: "#9ca3af" };
    if ((email.open_count || 0) > 1) return { text: `🔥 ${email.open_count} aperturas`, color: "#dc2626" };
    return { text: "✅ Abierto", color: "#10b981" };
  };

  return (
    <div style={{ padding: 20, maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Ultra Mejorado */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap", 
        gap: 12, 
        marginBottom: 24,
        padding: "16px",
        backgroundColor: "#f8fafc",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#1f2937" }}>
            📊 Panel de Email Analytics
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
            Seguimiento avanzado y análisis de correos electrónicos
          </p>
        </div>
        
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: autoRefresh ? "#10b981" : "#6b7280",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            {autoRefresh ? "🔄 Auto ON" : "⏸️ Auto OFF"}
          </button>
          
          <button
            onClick={loadEmails}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: "8px", 
              border: "none",
              backgroundColor: "#3b82f6",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "⏳ Cargando..." : "🔄 Actualizar"}
          </button>
          
          <button
            onClick={() => exportToCSV(sortedEmails, `emails-${new Date().toISOString().split('T')[0]}.csv`)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none", 
              backgroundColor: "#10b981",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            📊 CSV
          </button>
          
          <button
            onClick={() => exportToJSON(sortedEmails, `emails-${new Date().toISOString().split('T')[0]}.json`)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#8b5cf6", 
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            📦 JSON
          </button>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 24 
      }}>
        {[
          { label: "Total Enviados", value: stats.total, color: "#3b82f6", icon: "📧" },
          { label: "Exitosos", value: stats.sent, color: "#10b981", icon: "✅" },
          { label: "Abiertos", value: stats.opened, color: "#059669", icon: "👀" },
          { label: "Tasa Apertura", value: `${stats.openRate}%`, color: "#0ea5e9", icon: "📈" },
          { label: "Múltiples Aperturas", value: stats.multipleOpens, color: "#dc2626", icon: "🔥" },
          { label: "Fallidos", value: stats.failed, color: "#ef4444", icon: "❌" }
        ].map(stat => (
          <div key={stat.label} style={{
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: stat.color, marginBottom: "4px" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: 20, 
        marginBottom: 24 
      }}>
        <div style={{ 
          padding: "20px", 
          backgroundColor: "white", 
          borderRadius: "12px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>📊 Tasa de Apertura</h3>
          <Pie data={chartData.openRate} options={{ responsive: true, maintainAspectRatio: false }} height={200} />
        </div>
        
        <div style={{ 
          padding: "20px", 
          backgroundColor: "white", 
          borderRadius: "12px", 
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)" 
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>📱 Por Dispositivo</h3>
          <Pie data={chartData.deviceStats} options={{ responsive: true, maintainAspectRatio: false }} height={200} />
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div style={{
        padding: "20px",
        backgroundColor: "white", 
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        marginBottom: 24
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "16px" 
        }}>
          <h3 style={{ margin: 0 }}>🔍 Filtros Avanzados</h3>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: "4px 8px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            {showAdvancedFilters ? "➖ Ocultar" : "➕ Mostrar"}
          </button>
        </div>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: 12 
        }}>
          <input
            type="text"
            placeholder="🔍 Buscar por email, asunto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px"
            }}
          />
          
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db", 
              borderRadius: "8px",
              fontSize: "14px"
            }}
          >
            <option value="all">📋 Todos los estados</option>
            <option value="sent">✅ Solo enviados</option>
            <option value="failed">❌ Solo fallidos</option>
            <option value="opened">👀 Solo abiertos</option>
            <option value="not_opened">📪 No abiertos</option>
            <option value="multiple_opens">🔥 Múltiples aperturas</option>
          </select>
          
          <select 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px", 
              fontSize: "14px"
            }}
          >
            <option value="all">📅 Todas las fechas</option>
            <option value="today">🗓️ Hoy</option>
            <option value="week">📆 Esta semana</option>
            <option value="month">🗓️ Este mes</option>
          </select>
          
          {showAdvancedFilters && (
            <>
              <select 
                value={deviceFilter} 
                onChange={e => setDeviceFilter(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              >
                <option value="all">📱 Todos los dispositivos</option>
                <option value="mobile">📱 Móvil</option>
                <option value="tablet">📲 Tablet</option>
                <option value="desktop">💻 Escritorio</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              >
                <option value="created_at">📅 Fecha envío</option>
                <option value="opened_at">👁️ Fecha apertura</option>
                <option value="open_count">🔢 Num. aperturas</option>
                <option value="subject">📝 Asunto</option>
                <option value="to_email">👤 Destinatario</option>
              </select>
              
              <select 
                value={sortOrder} 
                onChange={e => setSortOrder(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px"
                }}
              >
                <option value="desc">⬇️ Descendente</option>
                <option value="asc">⬆️ Ascendente</option>
              </select>
            </>
          )}
        </div>
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

      {/* Tabla Ultra Mejorada */}
      {loading ? (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 0",
          backgroundColor: "white",
          borderRadius: "12px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <div>Cargando datos avanzados...</div>
        </div>
      ) : sortedEmails.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 0", 
          backgroundColor: "white",
          borderRadius: "12px",
          border: "2px dashed #d1d5db"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
          <div>No se encontraron correos con los filtros aplicados</div>
        </div>
      ) : (
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          {/* Tabla */}
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#1e40af", color: "white" }}>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📧 Email</th>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📅 Enviado</th>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📊 Estado</th>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>👁️ Aperturas</th>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>📱 Dispositivo</th>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>🌐 Navegador</th>
                  <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 600 }}>⚙️ Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmails.map((email, index) => {
                  const openStatus = getOpenStatus(email);
                  
                  return (
                    <tr 
                      key={email.id}
                      style={{ 
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fafb"
                      }}
                    >
                      <td style={{ padding: "12px" }}>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "14px" }}>
                            {email.to_email}
                          </div>
                          <div style={{ 
                            fontSize: "12px", 
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "200px"
                          }}>
                            {email.subject}
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ padding: "12px", fontSize: "13px", color: "#6b7280" }}>
                        {formatDate(email.created_at)}
                      </td>
                      
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          color: email.status === "sent" ? "#059669" : "#dc2626",
                          fontWeight: 600,
                          fontSize: "13px"
                        }}>
                          {email.status === "sent" ? "✅ Enviado" : "❌ Fallido"}
                        </span>
                      </td>
                      
                      <td style={{ padding: "12px" }}>
                        <div>
                          <span style={{ color: openStatus.color, fontWeight: 600, fontSize: "13px" }}>
                            {openStatus.text}
                          </span>
                          {email.opened_at && (
                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                              {formatDate(email.opened_at)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: "12px", fontSize: "13px" }}>
  <div>
    <div>
      {(typeof email.tracking_data === 'object' && email.tracking_data !== null && email.tracking_data.device)
        ? email.tracking_data.device
        : "Desconocido"}
    </div>
    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
      {(typeof email.tracking_data === 'object' && email.tracking_data !== null && email.tracking_data.os)
        ? email.tracking_data.os
        : ""}
    </div>
  </div>
</td>
                      
                      <td style={{ padding: "12px", fontSize: "13px" }}>
  {(typeof email.tracking_data === 'object' && email.tracking_data !== null && email.tracking_data.browser)
    ? email.tracking_data.browser
    : "-"}
</td>

                      
                      
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => setSelectedEmail(email)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                        >
                          👁️ Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          <div style={{
            display: "flex",
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "16px 20px",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e5e7eb"
          }}>
            <div style={{ fontSize: "14px", color: "#6b7280" }}>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedEmails.length)} de {sortedEmails.length} correos
            </div>
            
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px"
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: "6px 12px",
                  backgroundColor: currentPage === 1 ? "#f3f4f6" : "#3b82f6",
                  color: currentPage === 1 ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                ← Anterior
              </button>
              
              <span style={{ fontSize: "14px", padding: "0 8px" }}>
                {currentPage} / {Math.ceil(sortedEmails.length / itemsPerPage)}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(sortedEmails.length / itemsPerPage), currentPage + 1))}
                disabled={currentPage === Math.ceil(sortedEmails.length / itemsPerPage)}
                style={{
                  padding: "6px 12px", 
                  backgroundColor: currentPage === Math.ceil(sortedEmails.length / itemsPerPage) ? "#f3f4f6" : "#3b82f6",
                  color: currentPage === Math.ceil(sortedEmails.length / itemsPerPage) ? "#9ca3af" : "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: currentPage === Math.ceil(sortedEmails.length / itemsPerPage) ? "not-allowed" : "pointer",
                  fontSize: "12px"
                }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles */}
      {selectedEmail && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ margin: 0 }}>📧 Detalles del Email</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                style={{
                  padding: "8px",
                  backgroundColor: "transparent",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <strong>Destinatario:</strong> {selectedEmail.to_email}
              </div>
              <div>
                <strong>Asunto:</strong> {selectedEmail.subject}
              </div>
              <div>
                <strong>Estado:</strong> {selectedEmail.status}
              </div>
              <div>
                <strong>Fecha de envío:</strong> {formatDate(selectedEmail.created_at)}
              </div>
              {selectedEmail.opened_at && (
                <div>
                  <strong>Primera apertura:</strong> {formatDate(selectedEmail.opened_at)}
                </div>
              )}
              <div>
                <strong>Número de aperturas:</strong> {selectedEmail.open_count || 0}
              </div>
              {selectedEmail.tracking_data && (
                <div>
                  <strong>Datos de tracking:</strong>
                  <pre style={{
                    backgroundColor: "#f3f4f6",
                    padding: "12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "200px"
                  }}>
                    {JSON.stringify(selectedEmail.tracking_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailOpensDashboard;
