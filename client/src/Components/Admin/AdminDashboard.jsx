import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { Bar, Doughnut } from "react-chartjs-2";
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

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalFlights: 0, bookingsToday: 0, registeredUsers: 0, totalRevenue: 0, revenueToday: 0, weeklyFlights: { labels: [], data: [] } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats");
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Failed to load stats");
        setStats(json.stats);
      } catch (e) {
        console.error("Admin stats error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const baseLabels = stats.weeklyFlights.labels.length ? stats.weeklyFlights.labels : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const barData = {
    labels: baseLabels,
    datasets: [
      {
        type: "bar",
        label: "Flights",
        data: stats.weeklyFlights.data.length ? stats.weeklyFlights.data : [0,0,0,0,0,0,0],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderRadius: 6,
        yAxisID: "y",
      },
      {
        type: "bar",
        label: "Bookings",
        data: (stats.weeklyBookings && stats.weeklyBookings.length) ? stats.weeklyBookings : [0,0,0,0,0,0,0],
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderRadius: 6,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "Revenue (₹)",
        data: (stats.weeklyRevenue && stats.weeklyRevenue.length) ? stats.weeklyRevenue : [0,0,0,0,0,0,0],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        borderWidth: 2,
        tension: 0.3,
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
        grid: { drawOnChartArea: true },
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
      legend: { position: "top" },
      tooltip: {
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

  const formatINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

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
            <p className="text-2xl font-bold text-blue-700">{loading ? "…" : stats.totalFlights}</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Bookings Today</h2>
            <p className="text-2xl font-bold text-blue-700">{loading ? "…" : stats.bookingsToday}</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Registered Users</h2>
            <p className="text-2xl font-bold text-blue-700">{loading ? "…" : stats.registeredUsers}</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-1">Total Revenue</h2>
            <p className="text-2xl font-bold text-emerald-700">{loading ? "…" : formatINR(stats.totalRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">Today: <span className="font-semibold text-emerald-700">{loading ? "…" : formatINR(stats.revenueToday)}</span></p>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded shadow">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-700">This Week: Flights, Bookings & Revenue</h3>
              <span className="text-xs text-gray-500">Revenue today: <strong className="text-amber-600">{loading ? "…" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(stats.revenueToday || 0)}</strong></span>
            </div>
            <Bar data={barData} options={barOptions} />
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Bookings vs Users</h3>
            <Doughnut data={doughnutData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
