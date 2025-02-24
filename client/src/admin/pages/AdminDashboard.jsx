import React, { useEffect, useState } from "react";
import { FaUsers, FaBook, FaDollarSign, FaChartLine } from "react-icons/fa";
import AdminAnalytics from "./AdminAnalytics";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoursesSold: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("https://backend-production-cbe2.up.railway.app/api/admin/stats");
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers || 0,
          totalCoursesSold: data.totalCoursesSold || 0,
          totalRevenue: data.totalRevenue || 0, 
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">Manage users, courses, payments, and analytics efficiently.</p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <div className="bg-white shadow-lg p-6 rounded-lg flex items-center gap-4">
          <FaUsers className="text-blue-500 text-4xl" />
          <div>
            <h2 className="text-xl font-bold">{stats.totalUsers}</h2>
            <p className="text-gray-500">Total Users</p>
          </div>
        </div>

        {/* Courses Sold */}
        <div className="bg-white shadow-lg p-6 rounded-lg flex items-center gap-4">
          <FaBook className="text-green-500 text-4xl" />
          <div>
            <h2 className="text-xl font-bold">{stats.totalCoursesSold}</h2>
            <p className="text-gray-500">Total Courses Sold</p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white shadow-lg p-6 rounded-lg flex items-center gap-4">
          <FaDollarSign className="text-yellow-500 text-4xl" />
          <div>
            <h2 className="text-xl font-bold">
              ${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : "0"}
            </h2>
            <p className="text-gray-500">Total Revenue</p>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white shadow-lg p-6 rounded-lg flex items-center gap-4">
          <FaChartLine className="text-red-500 text-4xl" />
          <div>
            <h2 className="text-xl font-bold">Coming Soon</h2>
            <p className="text-gray-500">User Engagement</p>
          </div>
        </div>

      </div>
        <AdminAnalytics/>
    </div>
  );
};

export default AdminDashboard;
