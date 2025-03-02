import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import AnimatedSection from '../components/AnimatedSection.jsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ClassCard from '../components/ClassCard.jsx'

const Dashboard = () => {
  const { users } = useAuth() // ✅ Get user from AuthContext
  const navigate = useNavigate()
  const [purchasedClasses, setPurchasedClasses] = useState([])
  const [remainingSessions, setRemainingSessions] = useState([]) // ✅ Fix: Add missing state
  const [calendlyBookings, setCalendlyBookings] = useState([]) // ✅ State for Calendly Bookings
  const [coupons, setCoupons] = useState([]) // ✅ State for Coupons
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // ✅ State for Cancel Confirmation Popup
  const [showCancelPopup, setShowCancelPopup] = useState(false)
  const [selectedEventUri, setSelectedEventUri] = useState(null)

  // ✅ Redirect user if not logged in
  useEffect(() => {
    if (!users) {
      navigate('/login')
    }
  }, [users, navigate])

  // ✅ Fetch all user data when component mounts
  useEffect(() => {
    if (!users || !users._id) {
      console.warn('❌ User is not available, skipping API calls.')
      return // Prevent API calls if user is not available
    }

    setLoading(true)

    // Fetch Purchased Classes
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
          `https://backend-production-cbe2.up.railway.app/api/webhook/${users._id}/calendly-bookings`,
        )
        const data = await response.json()

        console.log('✅ Fetched Calendly Bookings:', data) // Debugging log

        if (!response.ok) throw new Error(data.message || 'No Calendly bookings found.')

        setCalendlyBookings(data.bookings || [])
      } catch (error) {
        console.error('❌ Error fetching Calendly bookings:', error)
        setCalendlyBookings([]) // Ensures UI doesn't break
      }
    }

    // Fetch Coupons
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

    // ✅ Fetch Remaining Sessions
    const fetchRemainingSessions = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/user/${users._id}/remaining-sessions`,
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to fetch remaining sessions.')
        setRemainingSessions(data.remainingSessions || [])
      } catch (error) {
        console.error('❌ Error fetching remaining sessions:', error)
        setRemainingSessions([])
      }
    }
    // Fetch Zoom Meeting

    // ✅ Run all API calls in parallel
    Promise.allSettled([
      fetchPurchasedClasses(),
      fetchCalendlyBookings(),
      fetchRemainingSessions(), // ✅ Fetch remaining sessions
      fetchCoupons(),
    ]).finally(() => setLoading(false))
  }, [users]) // ✅ Depend only on `users`

  // ✅ Open Cancel Confirmation Popup
  const confirmCancel = (eventUri) => {
    setSelectedEventUri(eventUri)
    setShowCancelPopup(true)
  }

  // ✅ Cancel Booking Function (After Confirmation)
  const cancelBooking = async () => {
    if (!selectedEventUri) return
    try {
      const response = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/cancel-booking',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: users._id, eventUri: selectedEventUri }),
        },
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      alert('Session Canceled Successfully')
      setCalendlyBookings(
        calendlyBookings.filter((booking) => booking.calendlyEventUri !== selectedEventUri),
      )
      setShowCancelPopup(false)
    } catch (error) {
      console.error('❌ Error canceling session:', error)
    }
  }

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="flex min-h-auto">
      <div className="flex-grow bg-gray-100">
        <AnimatedSection direction="right">
          {/* ✅ Display Purchased Classes */}
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

          {/* ✅ Display Calendly Bookings with Cancel & Reschedule Buttons */}
          {calendlyBookings.length > 0 && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-bold mb-2">📅 Your Scheduled Calendly Bookings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {calendlyBookings.map((booking, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg shadow-md border border-gray-300"
                  >
                    <h4 className="text-blue-600 font-semibold">
                      {booking.eventName || 'No Name'}
                    </h4>
                    <p>
                      <strong>📅 Start Time:</strong> {new Date(booking.startTime).toLocaleString()}
                    </p>
                    <p>
                      <strong>Status:</strong> {booking.status}
                    </p>
                    <a
                      href={booking.calendlyEventUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      📍 View on Calendly
                    </a>

                    {/* ✅ Cancel Button */}
                    <button
                      className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                      onClick={() => cancelBooking(booking.calendlyEventUri)}
                    >
                      ❌ Cancel
                    </button>

                    {/* ✅ Reschedule Button */}
                    <a
                      href={booking.calendlyEventUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      🔄 Reschedule
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ✅ Show Remaining Sessions */}
          {remainingSessions.length > 0 && (
            <section className="mt-6 p-4 bg-white shadow-md rounded-lg">
              <h3 className="text-lg font-bold mb-2">🕒 Your Remaining Sessions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {remainingSessions.map((session, index) => (
                  <div key={index} className="p-4 bg-blue-200 rounded-lg shadow">
                    <p>
                      <strong>📚 Plan:</strong> {session.name}
                    </p>
                    <p>
                      <strong>🕒 Remaining Sessions:</strong> {session.remainingSessions}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </AnimatedSection>
      </div>
      {/* ✅ Cancel Confirmation Popup */}
      {showCancelPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h3 className="text-lg font-bold">Are you sure you want to cancel this session?</h3>
            <div className="mt-4 flex justify-center space-x-4">
              <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={cancelBooking}>
                Yes, Cancel
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowCancelPopup(false)}
              >
                No, Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
