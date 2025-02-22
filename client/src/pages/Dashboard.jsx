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

    const fetchPurchasedClasses = async () => {
      setLoading(true)
      try {
        const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/${users._id}/purchased-classes`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'Failed to fetch purchased classes.')

        setPurchasedClasses(data.purchasedClasses || [])
      } catch (error) {
        console.error('❌ Error fetching classes:', error)
        setError('Failed to load classes. Try again.')
      }
    }

    const fetchZoomMeeting = async () => {
      try {
        const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/${users._id}/zoom-meeting`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'No Zoom meeting found.')

        setZoomMeeting(data.meeting)
      } catch (error) {
        console.error('❌ Error fetching Zoom meeting:', error)
        setZoomMeeting(null)
      } finally {
        setLoading(false)
      }
    }

    const fetchCalendlyBookings = async () => {
      try {
        const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/${users._id}/calendly-bookings`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'No Calendly bookings found.')

        setCalendlyBookings(data.bookings)
      } catch (error) {
        console.error('❌ Error fetching Calendly bookings:', error)
        setCalendlyBookings([])
      }
    }

    // ✅ Fetch Coupons
    const fetchCoupons = async () => {
      try {
        const response = await fetch(`https://backend-production-cbe2.up.railway.app/api/user-coupons/${users._id}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'No Coupons found.')

        setCoupons(data.coupons)
      } catch (error) {
        console.error('❌ Error fetching Coupons:', error)
        setCoupons([])
      }
    }

    fetchPurchasedClasses()
    fetchZoomMeeting()
    fetchCalendlyBookings() // ✅ Fetch Calendly Bookings
    fetchCoupons() // ✅ Fetch Coupons
  }, [users])

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

          {/* ✅ New Section for Calendly Bookings */}
          {calendlyBookings.length > 0 && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-bold mb-2">📅 Your Scheduled Calendly Bookings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {calendlyBookings.map((booking, index) => (
                  <div key={index} className="p-4 bg-gray-200 rounded-lg shadow">
                    <p>
                      <strong>📌 Event:</strong> {booking.eventType}
                    </p>
                    <p>
                      <strong>📅 Start:</strong> {new Date(booking.startTime).toLocaleString()}
                    </p>
                    <p>
                      <strong>⏳ End:</strong> {new Date(booking.endTime).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ✅ New Section for Coupons */}
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
                    <p>
                      <strong>✅ Valid:</strong>{' '}
                      {coupon.valid ? (
                        <span className="text-green-700 font-bold">Yes</span>
                      ) : (
                        <span className="text-red-600 font-bold">Expired</span>
                      )}
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
