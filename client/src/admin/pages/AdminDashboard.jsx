// AdminDashboard.js
import React, { useEffect, useState } from 'react'
import { FaUsers, FaBook, FaDollarSign, FaChartLine } from 'react-icons/fa'
import AdminAnalytics from './AdminAnalytics'
import io from 'socket.io-client' // Import socket.io-client

const SOCKET_SERVER_URL = 'https://backend-production-cbe2.up.railway.app' // Aapka backend server URL

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoursesSold: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    // 1. Fetch initial stats
    const fetchStats = async () => {
      try {
        const response = await fetch(`${SOCKET_SERVER_URL}/api/admin/stats`) // Use full URL
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setStats({
          totalUsers: data.totalUsers || 0,
          totalCoursesSold: data.totalCoursesSold || 0,
          totalRevenue: data.totalRevenue || 0,
        })
      } catch (error) {
        console.error('Error fetching initial stats:', error)
      }
    }
    fetchStats()

    // 2. Setup Socket.IO connection and listeners
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'], // Optional: Force websocket transport
    })

    socket.on('connect', () => {
      console.log('📊 Connected to WebSocket server')
    })

    socket.on('statsUpdated', (updatedStats) => {
      console.log('📊 Received stats update via WebSocket:', updatedStats)
      setStats((prevStats) => ({
        ...prevStats, // Keep existing stats like totalUsers if not updated by this event
        totalUsers:
          updatedStats.totalUsers !== undefined ? updatedStats.totalUsers : prevStats.totalUsers,
        totalCoursesSold:
          updatedStats.totalCoursesSold !== undefined
            ? updatedStats.totalCoursesSold
            : prevStats.totalCoursesSold,
        totalRevenue:
          updatedStats.totalRevenue !== undefined
            ? updatedStats.totalRevenue
            : prevStats.totalRevenue,
      }))
    })

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from WebSocket server')
    })

    socket.on('connect_error', (err) => {
      console.error('WebSocket Connection Error:', err)
    })

    // Cleanup on component unmount
    return () => {
      console.log('Unmounting AdminDashboard, disconnecting socket...')
      socket.disconnect()
    }
  }, []) // Empty dependency array ensures this runs once on mount and unmount

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
              $
              {stats.totalRevenue
                ? stats.totalRevenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '0.00'}
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
      <AdminAnalytics />
    </div>
  )
}

export default AdminDashboard
