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
import { Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Exportar CSV robusto
function exportToCSV(data, filename) {
  if (!data.length) return;
  const headers = [
    "ID", "Destinatario", "Remitente", "Asunto", "Fecha Envío", 
    "Estado", "Fecha Apertura", "Aperturas", "Última Apertura",
    "Dispositivo", "Navegador", "SO", "País", "Ciudad"
  ];
  const csvContent = [
    headers.join(","),
    ...data.map(email => {
      const td = email.tracking_data && typeof email.tracking_data === 'object'
        ? email.tracking_data : {};
      return [
        email.id,
        `"${email.to_email}"`,
        `"${email.from_email}"`,
        `"${email.subject?.replace(/"/g, '""') || ''}"`,
        email.created_at ? new Date(email.created_at).toLocaleString() : "",
        email.status,
        email.opened_at ? new Date(email.opened_at).toLocaleString() : "",
        email.open_count || 0,
        email.last_opened_at ? new Date(email.last_opened_at).toLocaleString() : "",
        td.device || "",
        td.browser || "",
        td.os || "",
        td.country || "",
        td.city || ""
      ].join(",");
    })
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

// Exportar JSON robusto
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
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dateRange, setDateRange] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Descarga robusta con defensas para tipos
  const loadEmails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/emails/history', { params: { limit: 1000, offset: 0 } });
      if (Array.isArray(response.data)) {
        // Forzar cada tracking_data a objeto
        setEmails(response.data.map(email => ({
          ...email,
          tracking_data: email.tracking_data && typeof email.tracking_data === 'string'
            ? (() => { try { return JSON.parse(email.tracking_data); } catch { return {}; } })()
            : (email.tracking_data || {})
        })));
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
  
  // Filtro avanzado y seguro ante datos inconsistentes
  const filteredEmails = useMemo(() => emails.filter(email => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!(
        (email.subject || "").toLowerCase().includes(searchLower) ||
        (email.to_email || "").toLowerCase().includes(searchLower) ||
        (email.from_email || "").toLowerCase().includes(searchLower)
      )) return false;
    }
    if (filter !== "all") {
      switch (filter) {
        case "opened": if (!email.opened_at) return false; break;
        case "not_opened": if (email.opened_at) return false; break;
        case "multiple_opens": if ((email.open_count || 0) <= 1) return false; break;
        case "sent": if (email.status !== "sent") return false; break;
        case "failed": if (email.status !== "failed") return false; break;
      }
    }
    // Filtro device robusto
    if (deviceFilter !== "all") {
      const device = (email.tracking_data.device || "").toLowerCase();
      const isMobile = !!email.tracking_data.is_mobile;
      const isTablet = !!email.tracking_data.is_tablet;
      switch (deviceFilter) {
        case "mobile": if (!isMobile) return false; break;
        case "tablet": if (!isTablet) return false; break;
        case "desktop": if (isMobile || isTablet) return false; break;
      }
    }
    // Filtro fecha robusto
    if (dateRange !== "all" && email.created_at) {
      const emailDate = new Date(email.created_at);
      const now = new Date();
      const daysDiff = (now - emailDate) / (1000 * 60 * 60 * 24);
      switch (dateRange) {
        case "today": if (daysDiff > 1) return false; break;
        case "week": if (daysDiff > 7) return false; break;
        case "month": if (daysDiff > 30) return false; break;
      }
    }
    return true;
  }), [emails, search, filter, deviceFilter, dateRange]);

  const sortedEmails = useMemo(() => [...filteredEmails].sort((a, b) => {
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
    return sortOrder === "asc" ? (valA > valB ? 1 : valA < valB ? -1 : 0) : (valA < valB ? 1 : valA > valB ? -1 : 0);
  }), [filteredEmails, sortBy, sortOrder]);

  const paginatedEmails = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedEmails.slice(start, start + itemsPerPage);
  }, [sortedEmails, currentPage, itemsPerPage]);

  // Estadísticas robustas
  const stats = useMemo(() => {
    const total = emails.length;
    const sent = emails.filter(e => e.status === "sent").length;
    const opened = emails.filter(e => e.opened_at).length;
    const failed = emails.filter(e => e.status === "failed").length;
    const multipleOpens = emails.filter(e => (e.open_count || 0) > 1).length;
    const deviceStats = emails.reduce((acc, email) => {
      const tdat = email.tracking_data || {};
      if (tdat.is_mobile) acc.mobile++;
      else if (tdat.is_tablet) acc.tablet++;
      else acc.desktop++;
      return acc;
    }, { mobile: 0, tablet: 0, desktop: 0 });
    const browserStats = emails.reduce((acc, email) => {
      const browser = (email.tracking_data?.browser || "Desconocido");
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {});
    return {
      total, sent, opened, failed,
      notOpened: sent - opened,
      multipleOpens,
      openRate: sent > 0 ? (opened / sent * 100).toFixed(2) : 0,
      successRate: total > 0 ? (sent / total * 100).toFixed(2) : 0,
      deviceStats,
      browserStats
    };
  }, [emails]);

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
    try { return new Date(dateStr).toLocaleString('es-ES'); } catch { return "-"; }
  };

  const getOpenStatus = (email) => {
    if (!email.opened_at) return { text: "📪 No abierto", color: "#9ca3af" };
    if ((email.open_count || 0) > 1) return { text: `🔥 ${email.open_count} aperturas`, color: "#dc2626" };
    return { text: "✅ Abierto", color: "#10b981" };
  };

  return (
    <div style={{ padding: 20, maxWidth: "1400px", margin: "0 auto" }}>
      {/* ... El resto del JSX permanece igual que tu estructura, solo asegurando tracking_data siempre objeto ... */}
      {/* Copia y pega desde tu última versión aquí, asegurando que cada vez que uses .tracking_data accedas robustamente: */}
      {/* (email.tracking_data?.device || "") => (typeof email.tracking_data === 'object' ? email.tracking_data.device : "") */}
      {/* En export, .map, estadísticas, y renderizado de detalles */}
    </div>
  );
};

export default EmailOpensDashboard;
