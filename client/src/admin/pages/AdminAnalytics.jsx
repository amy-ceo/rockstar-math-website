import React, { useEffect, useState } from 'react'
import { Line, Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js'

// ✅ Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
)

const AdminAnalytics = () => {
  const [revenueTrends, setRevenueTrends] = useState([])
  const [courseSales, setCourseSales] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [userSignups, setUserSignups] = useState([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/admin/analytics',
      )
      const data = await response.json()

      setRevenueTrends(data.revenueTrends || [])
      setCourseSales(data.courseSales || [])
      setPaymentMethods(data.paymentMethods || [])
      setUserSignups(data.userSignups || [])
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* ✅ Revenue Trends Line Chart */}
      <div className="bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-xl font-bold">Revenue Trends</h2>
        {revenueTrends.length > 0 ? (
          <Line
            data={{
              labels: revenueTrends.map((item) => item.date),
              datasets: [
                {
                  label: 'Revenue ($)',
                  data: revenueTrends.map((item) => item.amount),
                  borderColor: 'rgba(75,192,192,1)',
                  backgroundColor: 'rgba(75,192,192,0.2)',
                },
              ],
            }}
          />
        ) : (
          <p className="text-gray-500">No revenue data available.</p>
        )}
      </div>

      {/* ✅ Course Sales Pie Chart */}

      {/* ✅ Payment Methods Bar Chart */}
      <div className="bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-xl font-bold">Payment Methods Used</h2>
        {paymentMethods.length > 0 ? (
          <Bar
            data={{
              labels: paymentMethods.map((item) => item.method),
              datasets: [
                {
                  label: 'Payments',
                  data: paymentMethods.map((item) => item.count),
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                },
              ],
            }}
          />
        ) : (
          <p className="text-gray-500">No payment methods data available.</p>
        )}
      </div>

      {/* ✅ New User Signups Bar Chart */}
      <div className="bg-white shadow-lg p-6 rounded-lg">
        <h2 className="text-xl font-bold">New User Signups</h2>
        {userSignups.length > 0 ? (
          <Bar
            data={{
              labels: userSignups.map((item) => item.date),
              datasets: [
                {
                  label: 'Users',
                  data: userSignups.map((item) => item.count),
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                },
              ],
            }}
          />
        ) : (
          <p className="text-gray-500">No user signups available.</p>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics
