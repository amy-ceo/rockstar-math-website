import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import AnimatedSection from '../components/AnimatedSection.jsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ClassCard from '../components/ClassCard.jsx'

const Dashboard = () => {
  const { users } = useAuth() // ✅ Use AuthContext properly
  const navigate = useNavigate()
  const [purchasedClasses, setPurchasedClasses] = useState([])
  const [zoomMeeting, setZoomMeeting] = useState(null)
  const [calendlyBookings, setCalendlyBookings] = useState([]) // ✅ New State for Calendly Bookings
  const [coupons, setCoupons] = useState([]) // ✅ New State for Coupons
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!users) {
      navigate('/login') // 🚀 Redirect if not logged in
    }
  }, [users, navigate])

  useEffect(() => {
    if (!users || !users._id) return

    setLoading(true)

    const fetchPurchasedClasses = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/${users._id}/purchased-classes`,
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to fetch purchased classes.')
        setPurchasedClasses(data.purchasedClasses || [])
      } catch (error) {
        console.error('❌ Error fetching classes:', error)
        setError('Failed to load classes. Try again.')
      }
    }

    const fetchCalendlyBookings = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/webhook/${users._id}/calendly-bookings`
        );
        
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'No Calendly bookings found.')

        const currentDate = new Date()
        const activeSessions = []
        const expiredSessions = []

        data.bookings.forEach((session) => {
          if (new Date(session.startTime) < currentDate) {
            expiredSessions.push(session)
          } else {
            activeSessions.push(session)
          }
        })

        setCalendlyBookings(activeSessions)

        if (expiredSessions.length > 0) {
          console.log(`📂 Archiving ${expiredSessions.length} expired sessions...`)
          await archiveExpiredSessions(expiredSessions)
        }
      } catch (error) {
        console.error('❌ Error fetching Calendly bookings:', error)
        setCalendlyBookings([])
      }
    }

    const fetchCoupons = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/user-coupons/${users._id}`,
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'No Coupons found.')
        setCoupons(data.coupons)
      } catch (error) {
        console.error('❌ Error fetching Coupons:', error)
        setCoupons([])
      }
    }

    const fetchZoomMeeting = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/${users._id}/zoom-meeting`,
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'No Zoom meeting found.')
        setZoomMeeting(data.meeting)
      } catch (error) {
        console.error('❌ Error fetching Zoom meeting:', error)
        setZoomMeeting(null)
      }
    }

    // ✅ Run all API calls in parallel to improve performance
    Promise.allSettled([
      fetchPurchasedClasses(),
      fetchZoomMeeting(),
      fetchCalendlyBookings(),
      fetchCoupons(),
    ]).finally(() => setLoading(false))

    // ✅ Auto-update purchased classes when user data changes in LocalStorage
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'))
      if (updatedUser && updatedUser.purchasedClasses) {
        setPurchasedClasses(updatedUser.purchasedClasses)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [users])

  // ✅ Function to Archive Expired Sessions
  const archiveExpiredSessions = async (expiredSessions) => {
    try {
      const response = await fetch(
        `https://backend-production-cbe2.up.railway.app/api/${users._id}/archive-calendly-sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions: expiredSessions }),
        },
      )

      if (!response.ok) {
        throw new Error('Failed to archive expired sessions.')
      }

      console.log('✅ Expired Calendly sessions moved to archive successfully!')
    } catch (error) {
      console.error('❌ Error archiving sessions:', error)
    }
  }

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="flex min-h-auto">
      <div className="flex-grow bg-gray-100">
        <AnimatedSection direction="right">
          {purchasedClasses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {purchasedClasses.map((classItem, index) => (
                <ClassCard
                  key={index}
                  classData={classItem}
                  userId={users._id}
                  setPurchasedClasses={setPurchasedClasses}
                />
              ))}
            </div>
          ) : (
            <p>No Purchased Classes</p>
          )}

          {/* ✅ Display Zoom Meeting Details */}
          {zoomMeeting && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3>Your Upcoming Zoom Meeting:</h3>
              <p>
                <strong>Topic:</strong> {zoomMeeting.topic}
              </p>
              <p>
                <strong>Start Time:</strong> {new Date(zoomMeeting.startTime).toLocaleString()}
              </p>
              <a
                href={zoomMeeting.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                ➡️ Join Meeting
              </a>
            </section>
          )}

          {/* ✅ Show Only Active Calendly Bookings */}
          {calendlyBookings.length > 0 && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-bold mb-2">📅 Your Scheduled Calendly Bookings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {calendlyBookings.map((booking, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg shadow-md border border-gray-300"
                  >
                    <h4 className="text-blue-600 font-semibold">{booking.eventType}</h4>
                    <p>
                      <strong>📅 Start Time:</strong> {new Date(booking.startTime).toLocaleString()}
                    </p>
                    <p>
                      <strong>⏳ End Time:</strong> {new Date(booking.endTime).toLocaleString()}
                    </p>
                    <p>
                      <a
                        href={booking.bookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        📍 View on Calendly
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ✅ Show Available Coupons */}
          {coupons.length > 0 && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-bold mb-2">🎟 Your Available Coupons</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {coupons.map((coupon, index) => (
                  <div key={index} className="p-4 bg-green-200 rounded-lg shadow">
                    <p>
                      <strong>💰 Coupon Code:</strong> {coupon.code}
                    </p>
                    <p>
                      <strong>🎯 Discount:</strong> {coupon.percent_off}% Off
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </AnimatedSection>
      </div>
    </div>
  )
}

export default Dashboard
