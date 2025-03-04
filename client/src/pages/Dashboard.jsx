import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import AnimatedSection from '../components/AnimatedSection.jsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ClassCard from '../components/ClassCard.jsx'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

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
  const [showReschedulePopup, setShowReschedulePopup] = useState(false)
  const [selectedRescheduleEvent, setSelectedRescheduleEvent] = useState(null)
  const [newDateTime, setNewDateTime] = useState(null)

  // ✅ Allowed Time Slots (3-6 PM, 7-8 PM, 8-9 PM with breaks)
  const allowedTimes = [
    new Date().setHours(15, 0, 0, 0), // 3:00 PM
    new Date().setHours(15, 30, 0, 0), // 3:30 PM
    new Date().setHours(16, 0, 0, 0), // 4:00 PM
    new Date().setHours(16, 30, 0, 0), // 4:30 PM
    new Date().setHours(17, 0, 0, 0), // 5:00 PM
    new Date().setHours(17, 30, 0, 0), // 5:30 PM
    new Date().setHours(18, 0, 0, 0), // 6:00 PM

    // Break from 6:00 PM - 7:00 PM ❌ (No slots here)

    new Date().setHours(19, 0, 0, 0), // 7:00 PM
    new Date().setHours(19, 30, 0, 0), // 7:30 PM
    new Date().setHours(20, 0, 0, 0), // 8:00 PM

    // Break from 8:00 PM - 9:00 PM ❌ (No slots here)

    new Date().setHours(21, 0, 0, 0), // 9:00 PM
  ]

  console.log(allowedTimes)

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

      // ✅ Remove the canceled session from UI
      setCalendlyBookings(
        calendlyBookings.filter((booking) => booking.calendlyEventUri !== selectedEventUri),
      )

      // ✅ Hide the popup after canceling
      setShowCancelPopup(false)
      setSelectedEventUri(null) // ✅ Reset Selected Event
    } catch (error) {
      console.error('❌ Error canceling session:', error)
    }
  }

  const openReschedulePopup = (eventUri) => {
    setSelectedRescheduleEvent(eventUri)
    setShowReschedulePopup(true)
  }

  const handleReschedule = async () => {
    if (!selectedRescheduleEvent || !newDateTime) return

    try {
      const response = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/reschedule-booking',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: users._id,
            eventUri: selectedRescheduleEvent,
            newDateTime,
          }),
        },
      )

      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      alert('Session Rescheduled Successfully ✅')

      // ✅ Hide reschedule button
      setCalendlyBookings(
        calendlyBookings.map((booking) =>
          booking.calendlyEventUri === selectedRescheduleEvent
            ? { ...booking, startTime: newDateTime, rescheduled: true }
            : booking,
        ),
      )

      // ✅ Close popup
      setShowReschedulePopup(false)
      setSelectedRescheduleEvent(null)
      setNewDateTime(null)
    } catch (error) {
      console.error('❌ Error rescheduling session:', error)
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

          {/* ✅ Professional Redesigned Display of Calendly Bookings */}
          {calendlyBookings.length > 0 && (
            <section className="mt-6 p-6 bg-white shadow-lg rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                📅 Your Scheduled Appointments
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {calendlyBookings.map((booking, index) => (
                  <div
                    key={index}
                    className="p-5 bg-white rounded-xl shadow-lg border border-gray-200 transition transform hover:scale-105"
                  >
                    {/* Event Name */}
                    <h4 className="text-xl font-semibold text-blue-700 mb-2">
                      {booking.eventName || 'No Name'}
                    </h4>

                    {/* Start Time */}
                    <p className="text-gray-600">
                      <strong className="text-gray-800">📅 Start Time:</strong>{' '}
                      {new Date(booking.startTime).toLocaleString()}
                    </p>

                    {/* Status */}
                    <p className="mt-1 text-gray-600">
                      <strong className="text-gray-800">Status:</strong> {booking.status}
                    </p>

                    {/* View Links (Calendly & Zoom) */}
                    <div className="flex items-center mt-3 space-x-4">
                      {/* View on Calendly */}
                      <a
                        href={booking.calendlyEventUri.replace(
                          'api.calendly.com/scheduled_events',
                          'calendly.com/event_link',
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium hover:underline"
                      >
                        🌐 View on Calendly
                      </a>

                      {/* View on Zoom (Only if Zoom Link Exists) */}
                      {booking.zoomMeetingLink && (
                        <a
                          href={booking.zoomMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 font-medium hover:underline"
                        >
                          🎥 View on Zoom
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-3">
                      {/* Cancel Button */}
                      <button
                        className="flex-1 bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition hover:bg-red-600"
                        onClick={() => confirmCancel(booking.calendlyEventUri)}
                      >
                        ❌ Cancel
                      </button>

                      {/* Reschedule Button */}
                      {!booking.rescheduled && (
                        <button
                          className="flex-1 bg-green-500 text-white font-medium px-4 py-2 rounded-lg transition hover:bg-green-600"
                          onClick={() => openReschedulePopup(booking.calendlyEventUri)}
                        >
                          🔄 Reschedule
                        </button>
                      )}
                    </div>
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

      {/* ✅ Reschedule Popup */}
      {showReschedulePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg text-center">
            <h3 className="text-lg font-bold">Reschedule Your Session</h3>
            <p>Select a new date & time:</p>
            <DatePicker
              selected={newDateTime}
              onChange={(date) => setNewDateTime(date)}
              showTimeSelect
              includeTimes={allowedTimes.map((time) => new Date(time))}
              timeFormat="HH:mm"
              timeIntervals={30}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="border p-2 mt-2"
              filterDate={(date) => {
                const day = date.getDay()
                return day >= 1 && day <= 4 // Monday (1) to Thursday (4)
              }}
            />
            <div className="mt-4 flex justify-center space-x-4">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleReschedule}
              >
                ✅ Confirm Reschedule
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowReschedulePopup(false)}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
