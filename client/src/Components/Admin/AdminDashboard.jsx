import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import adminHttp from "../../api/adminHttp";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

  // Lightweight plugin to render value labels at the end of bars
  const valueLabelPlugin = {
    id: "valueLabel",
    afterDatasetsDraw(chart, args, pluginOptions) {
      const opt = chart.options?.plugins?.valueLabel;
      if (!opt || opt.display === false) return;
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (!meta || meta.type !== 'bar') return; // label bars only
        meta.data.forEach((element, idx) => {
          const val = dataset.data?.[idx];
          if (val == null) return;
          ctx.save();
          ctx.fillStyle = opt.color || "#111827"; // slate-900
          ctx.font = (opt.font || "12px sans-serif");
          ctx.textBaseline = "middle";
          // for horizontal bar, x is value axis
          const x = element.x + 6;
          const y = element.y;
          ctx.fillText(String(Math.round(val)), x, y);
          ctx.restore();
        });
      });
    }
  };
  ChartJS.register(valueLabelPlugin);

  // Lightweight plugin to render labels inside pie/doughnut slices (Top Routes)
  const pieLabelPlugin = {
    id: "pieLabel",
    afterDatasetsDraw(chart, args, pluginOptions) {
      const opt = chart.options?.plugins?.pieLabel;
      if (!opt || opt.display === false) return;
      const type = chart.config?.type;
      if (type !== 'pie' && type !== 'doughnut') return;
      const ctx = chart.ctx;
      const meta = chart.getDatasetMeta(0);
      const labels = chart.data.labels || [];
      if (!meta || !meta.data) return;
      meta.data.forEach((arc, i) => {
        const label = labels[i];
        if (!label) return;
        // Skip very small slices
        const circ = arc.circumference || 0;
        if (circ && circ < 0.25) return;
        const pos = arc.tooltipPosition();
        const maxChars = opt.maxChars ?? 16;
        const text = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
        ctx.save();
        ctx.fillStyle = opt.color || "#ffffff";
        ctx.font = opt.font || "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // Optional subtle shadow for contrast
        if (opt.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.25)";
          ctx.shadowBlur = 2;
        }
        ctx.fillText(text, pos.x, pos.y);
        ctx.restore();
      });
    }
  };
  ChartJS.register(pieLabelPlugin);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalFlights: 0, bookingsToday: 0, registeredUsers: 0, totalRevenue: 0, revenueToday: 0, weeklyFlights: { labels: [], data: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const REFRESH_INTERVAL_MS = 30000; // auto-refresh every 30s

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      // Use adminHttp which includes authentication token
      const res = await adminHttp.get("/admin/stats");
      if (!res.data.success) throw new Error(res.data.message || "Failed to load stats");
      setStats(res.data.stats);
      setError("");
    } catch (e) {
      console.error("Admin stats error:", e);
      const errorMsg = e.response?.data?.message || e.message || "Failed to load stats";
      setError(errorMsg);
      // If unauthorized, show specific message
      if (e.response?.status === 401 || e.response?.status === 403) {
        setError("Unauthorized: Please log in as admin");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh periodically and on focus/visibility
    const id = setInterval(() => {
      fetchStats();
    }, REFRESH_INTERVAL_MS);
    const onFocus = () => fetchStats();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchStats();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const baseLabels = stats.weeklyFlights.labels.length ? stats.weeklyFlights.labels : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hourlyLabels = (stats.hourlyLabels && stats.hourlyLabels.length) ? stats.hourlyLabels : Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, '0'));
  const hourlyBookings = (stats.hourlyBookings && stats.hourlyBookings.length) ? stats.hourlyBookings : Array.from({ length: 24 }, () => 0);
  const hourlyRevenue = (stats.hourlyRevenue && stats.hourlyRevenue.length) ? stats.hourlyRevenue : Array.from({ length: 24 }, () => 0);
  // Daily series (last 7 days) used by charts below
  const zeros = [0, 0, 0, 0, 0, 0, 0];
  const dailyLabels = (stats.dailyLabels && stats.dailyLabels.length) ? stats.dailyLabels : baseLabels;
  const dailyBookings = (stats.dailyBookings && stats.dailyBookings.length) ? stats.dailyBookings : zeros;
  const dailyRevenue = (stats.dailyRevenue && stats.dailyRevenue.length) ? stats.dailyRevenue : zeros;
  const barData = {
    labels: dailyLabels,
    datasets: [
      {
        type: "bar",
        label: "Bookings (Daily)",
        data: dailyBookings,
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderRadius: 6,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Revenue (₹)",
        data: dailyRevenue,
        borderColor: "#fbbf24",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 1,
        pointHoverRadius: 4,
        yAxisID: "y1",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    stacked: false,
    scales: {
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        title: { display: true, text: "Count" },
        grid: { drawOnChartArea: true, color: '#e5e7eb' },
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        title: { display: true, text: "Revenue (₹)" },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true } },
      tooltip: {
        backgroundColor: "rgba(17,24,39,0.9)",
        titleColor: "#F9FAFB",
        bodyColor: "#E5E7EB",
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (label.includes("Revenue")) {
              return `${label}: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0)}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  const doughnutData = {
    labels: ["Bookings Today", "Registered Users"],
    datasets: [
      {
        label: "Stats",
        data: [stats.bookingsToday, stats.registeredUsers],
        backgroundColor: ["#3B82F6", "#10B981"],
        borderColor: ["#2563EB", "#059669"],
        borderWidth: 1,
      },
    ],
  };

  // New analysis datasets
  const weeklyBookingsAll = (stats.weeklyBookings && stats.weeklyBookings.length) ? stats.weeklyBookings : zeros;
  const weeklyBookingsCompleted = (stats.weeklyBookingsCompleted && stats.weeklyBookingsCompleted.length) ? stats.weeklyBookingsCompleted : zeros;
  const weeklyBookingsCancelled = (stats.weeklyBookingsCancelled && stats.weeklyBookingsCancelled.length) ? stats.weeklyBookingsCancelled : zeros;

  // Daily (last 7 days) trending line for bookings and revenue

  const dailyLineData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: "Bookings (Hourly)",
        data: hourlyBookings,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointStyle: 'circle',
        yAxisID: "y",
      },
      {
        label: "Revenue Today (₹)",
        data: hourlyRevenue,
        borderColor: "#fbbf24",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointStyle: 'triangle',
        borderDash: [6, 4],
        yAxisID: "y1",
      },
    ],
  };

  const dailyLineOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    stacked: false,
    scales: {
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        title: { display: true, text: "Bookings", color: "#4B5563" },
        ticks: { color: "#4B5563", callback: (v) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v || 0) },
        grid: { drawOnChartArea: true, color: '#e5e7eb' },
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        title: { display: true, text: "Revenue (₹)", color: "#4B5563" },
        ticks: { color: "#4B5563", callback: (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0) },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true } },
      tooltip: {
        backgroundColor: "rgba(17,24,39,0.9)",
        titleColor: "#F9FAFB",
        bodyColor: "#E5E7EB",
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            if (label.includes("Revenue")) {
              return `${label}: ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0)}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    }
  };

  // Daily Profit (computed as 60% of daily revenue)
  const dailyProfit = dailyRevenue.map(v => Math.round(((v || 0) * 0.6)));
  const dailyProfitData = {
    labels: dailyLabels,
    datasets: [
      {
        label: "Profit (₹, 60%)",
        data: dailyProfit,
        borderColor: "#818cf8",
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
    ],
  };
  const dailyProfitOptions = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: "Profit (₹)" } },
    },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true } },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
          }
        }
      }
    }
  };

  // Removed revenue compare datasets/options

  // Removed Payment Status Distribution chart

  // Tickets Sold (last 7 days) - Bar chart using dailyBookings
  const ticketsSoldBarData = {
    labels: dailyLabels,
    datasets: [
      {
        type: "bar",
        label: "Tickets Sold",
        data: dailyBookings,
        backgroundColor: "rgba(59, 130, 246, 0.6)", // blue-500
        borderColor: "#3B82F6",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
  const ticketsSoldBarOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Tickets" },
        grid: { color: "#e5e7eb" },
      },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { position: "top", labels: { usePointStyle: true } },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            return `Tickets Sold: ${value}`;
          },
        },
      },
      valueLabel: { display: true, font: "12px sans-serif", color: "#111827" },
    },
    maintainAspectRatio: false,
  };

  const topRoutes = Array.isArray(stats.topRoutes) ? stats.topRoutes : [];
  const topRouteLabels = topRoutes.length ? topRoutes.map(r => `${r.from} → ${r.to}`) : ["No data"];
  const topRouteCounts = topRoutes.length ? topRoutes.map(r => r.count || 0) : [0];
  const routePalette = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16"]; // indigo, green, amber, red, cyan, lime
  const topRouteColors = topRouteLabels.map((_, i) => `${routePalette[i % routePalette.length]}B3`); // semi-transparent
  // Pie chart for Top Routes (Last 30 days)
  const topRoutesPieData = {
    labels: topRouteLabels,
    datasets: [
      {
        label: "Bookings",
        data: topRouteCounts,
        backgroundColor: ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16", "#A78BFA", "#F472B6"],
        borderColor: "#ffffff",
        borderWidth: 1,
      },
    ],
  };
  const topRoutesPieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "Route";
            const value = context.parsed || 0;
            return `${label}: ${value}`;
          },
        },
      },
      pieLabel: { display: true, font: "11px sans-serif", color: "#ffffff", maxChars: 16, shadow: true },
    },
    maintainAspectRatio: false,
  };

  const formatINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  // Removed growth calculations and pills

  // End datasets

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 bg-gray-100 p-6 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to the Admin Dashboard</h1>
        <p className="text-gray-600">
          Here you can manage <strong>flights</strong>, <strong>bookings</strong>, <strong>users</strong>, etc.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Total Flights</h2>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-blue-700">{loading ? "…" : stats.totalFlights}</p>
            </div>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Bookings Today</h2>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-blue-700">{loading ? "…" : stats.bookingsToday}</p>
            </div>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Registered Users</h2>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-blue-700">{loading ? "…" : stats.registeredUsers}</p>
            </div>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-1">Total Revenue</h2>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-emerald-700">{loading ? "…" : formatINR(stats.totalRevenue)}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">Today: <span className="font-semibold text-emerald-700">{loading ? "…" : formatINR(stats.revenueToday)}</span></p>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Overview Mixed Chart (Daily) */}
          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Last 7 Days: Bookings & Revenue (Daily)</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Revenue today: <strong className="text-amber-600">{loading ? "…" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format((stats.revenueTodayCompleted ?? stats.revenueToday) || 0)}</strong></span>
                <span className="hidden md:inline text-[11px] text-gray-400">Auto-updates every 30s</span>
                <button onClick={fetchStats} disabled={refreshing} className={`px-3 py-1.5 rounded text-sm border ${refreshing ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'}`}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
              </div>
            </div>
            <div style={{ height: 340 }}>
              <Bar data={barData} options={{ ...barOptions, maintainAspectRatio: false, scales: { ...barOptions.scales, y: { ...barOptions.scales.y, grid: { color: '#e5e7eb' } }, y1: { ...barOptions.scales.y1, grid: { drawOnChartArea: false } } } }} />
            </div>
          </div>

          {/* Tickets Sold (Last 7 Days) - Bar */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Tickets Sold (Last 7 Days)</h3>
            <div style={{ height: 340 }}>
              <Bar data={ticketsSoldBarData} options={ticketsSoldBarOptions} />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profit (Last 7 Days, 60% of Revenue) */}
            <div className="bg-white p-6 rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Profit (Last 7 Days)</h3>
            </div>
            <div style={{ height: 340 }}>
              <Line data={dailyProfitData} options={{ ...dailyProfitOptions, maintainAspectRatio: false, scales: { ...dailyProfitOptions.scales, y: { ...dailyProfitOptions.scales.y, grid: { color: '#e5e7eb' } } } }} />
            </div>
          </div>

          {/* Top Routes - Pie */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Top Routes (Last 30 Days)</h3>
            <div style={{ height: 340 }}>
              <Pie data={topRoutesPieData} options={topRoutesPieOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
