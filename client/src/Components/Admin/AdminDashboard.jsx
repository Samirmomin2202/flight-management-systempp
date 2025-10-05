import React from "react";
import AdminSidebar from "./AdminSidebar";
import {
  Bar,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
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
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  // Dummy data – replace with real API calls if needed
  const totalFlights = 24;
  const bookingsToday = 56;
  const registeredUsers = 142;

  const barData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Flights",
        data: [4, 6, 5, 8, 7, 9, 5],
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderRadius: 6,
      },
    ],
  };

  const doughnutData = {
    labels: ["Bookings Today", "Registered Users"],
    datasets: [
      {
        label: "Stats",
        data: [bookingsToday, registeredUsers],
        backgroundColor: ["#3B82F6", "#10B981"],
        borderColor: ["#2563EB", "#059669"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 bg-gray-100 p-6 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to the Admin Dashboard</h1>
        <p className="text-gray-600">
          Here you can manage <strong>flights</strong>, <strong>bookings</strong>, <strong>users</strong>, etc.
        </p>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Total Flights</h2>
            <p className="text-2xl font-bold text-blue-700">{totalFlights}</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Bookings Today</h2>
            <p className="text-2xl font-bold text-blue-700">{bookingsToday}</p>
          </div>
          <div className="bg-white shadow-md p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Registered Users</h2>
            <p className="text-2xl font-bold text-blue-700">{registeredUsers}</p>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Flights This Week</h3>
            <Bar data={barData} />
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
