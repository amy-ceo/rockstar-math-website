import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import AnimatedSection from '../components/AnimatedSection.jsx'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ClassCard from '../components/ClassCard.jsx'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import toast, { Toaster } from 'react-hot-toast'

const Dashboard = () => {
  const { users } = useAuth() // ✅ Get user from AuthContext
  const navigate = useNavigate()
  const [purchasedClasses, setPurchasedClasses] = useState([])
  const [remainingSessions, setRemainingSessions] = useState([]) // ✅ Fix: Add missing state
  const [calendlyBookings, setCalendlyBookings] = useState([]) // ✅ State for Calendly Bookings
  const [coupons, setCoupons] = useState([]) // ✅ State for Coupons
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archivedClasses, setArchivedClasses] = useState([]) // ✅ New State for Archive
  const [showCancelPopup, setShowCancelPopup] = useState(false)
  const [user, setUser] = useState(null) // ✅ Fix: Store user locally
  const [selectedEventUri, setSelectedEventUri] = useState(null)
  const [selectedStartTime, setSelectedStartTime] = useState(null)
  const [showReschedulePopup, setShowReschedulePopup] = useState(false)
  const [selectedRescheduleEvent, setSelectedRescheduleEvent] = useState(null)
  const [newDateTime, setNewDateTime] = useState(null)
  const [zoomBookings, setZoomBookings] = useState([])
  const [popupKey, setPopupKey] = useState(0)

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
    new Date().setHours(20, 30, 0, 0), // 8:00 PM

    // Break from 8:00 PM - 9:00 PM ❌ (No slots here)

    new Date().setHours(21, 0, 0, 0), // 9:00 PM
  ]

  console.log(allowedTimes)
  // ❌ Courses that should NOT appear in "Remaining Sessions"
  const excludedPlans = ['Learn', 'Achieve', 'Excel', 'Common Core- Parents']

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (!storedUser || !storedUser._id) {
      console.warn('⚠️ User not logged in, redirecting to login...')
      navigate('/login')
    }
    setUser(storedUser)
  }, [])

  // ✅ Fetch all user data when component mounts
  useEffect(() => {
    if (!user || !user._id) return

    console.log('📡 Fetching data for User ID:', user._id)
    setLoading(true)

    // Fetch Purchased Classes
    const fetchPurchasedClasses = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/${user._id}/purchased-classes`,
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'Failed to fetch purchased classes.')

         // Ensure proxyBookingLink exists in each purchased class
         const updatedClasses = (data.purchasedClasses || []).map((cls) => ({
          ...cls,
          proxyBookingLink: cls.proxyBookingLink || null,
        }));

        setPurchasedClasses(updatedClasses);
      } catch (error) {
        console.error('❌ Error fetching classes:', error)
        setError('Failed to load classes. Try again.')
      }
    }


    const fetchCalendlyBookings = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/webhook/calendly/${user._id}/calendly-bookings`,
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

    const fetchZoomBookings = async () => {
      if (!user || !user._id) {
        console.warn('⚠️ User ID is missing. Skipping Zoom booking fetch.')
        return
      }

      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/zoom/bookings/${user._id}`,
        )

        const data = await response.json()

        if (!response.ok) throw new Error(data.error || 'Failed to fetch Zoom bookings.')

        // ✅ Ensure sessionDates and timezone are always present
        const processedBookings = data.zoomBookings.map((booking) => ({
          ...booking,
          sessionDates: Array.isArray(booking.sessionDates) ? booking.sessionDates : [],
          timezone: booking.timezone || 'UTC', // ✅ Ensure timezone is present
        }))

        setZoomBookings(processedBookings)
      } catch (error) {
        console.error('❌ Error fetching Zoom bookings:', error)
        setZoomBookings([])
      }
    }

    // Fetch Coupons
    const fetchCoupons = async () => {
      try {
        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/user-coupons/${user._id}`,
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
        setLoading(true)

        const response = await fetch(
          `https://backend-production-cbe2.up.railway.app/api/user/${user._id}/remaining-sessions`,
        )
        const data = await response.json()

        if (!response.ok) throw new Error(data.message || 'Failed to fetch remaining sessions.')

        // ✅ Filter out only the excluded plans & ensure bookingLink exists
        const filteredSessions = (data.remainingSessions || [])
          .filter((session) => !excludedPlans.includes(session.name))
          .map((session) => ({
            ...session,
            proxyBookingLink: session.proxyBookingLink || null, // ✅ Ensure bookingLink is present
          }))

        setRemainingSessions(filteredSessions)
      } catch (error) {
        console.error('❌ Error fetching remaining sessions:', error)
        setRemainingSessions([])
      } finally {
        setLoading(false)
      }
    }

    if (users?._id) {
      fetchZoomBookings()
    }
    const fetchAllData = async () => {
      await Promise.allSettled([
        fetchPurchasedClasses(),
        fetchCalendlyBookings(),
        fetchRemainingSessions(),
        fetchCoupons(),
      ])
      setLoading(false)
    }
    fetchAllData()
  }, [user]) // ✅ Depend only on `users`
  const handleError = (errorMessage) => {
    toast.error(errorMessage);
    setError(errorMessage);
  };

  const handleReschedule = async () => {
    if (!selectedRescheduleEvent || !newDateTime) {
      console.warn('❌ No event or new date selected!')
      return
    }

    try {
      console.log('📤 Sending request to reschedule:', {
        userId: users._id,
        eventUri: selectedRescheduleEvent,
        newDateTime,
      })

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
      console.log('📥 API Response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Rescheduling failed.')
      }

      alert('Session Rescheduled Successfully ✅')

      // ✅ Update UI
      setCalendlyBookings((prev) =>
        prev.map((booking) =>
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

  const confirmCancel = (eventUri) => {
    setSelectedEventUri(eventUri)
    setShowCancelPopup(true)
  }

  const cancelBooking = async (eventUri) => {
    if (!eventUri || typeof eventUri !== 'string') {
      toast.error('Invalid Calendly Event URI!')
      console.error('❌ Invalid calendlyEventUri:', eventUri)
      return
    }

    try {
      console.log('📡 Sending cancel request to API...', {
        userId: users._id,
        calendlyEventUri: eventUri,
      })

      const response = await fetch(
        'https://backend-production-cbe2.up.railway.app/api/cancel-booking',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: users._id,
            calendlyEventUri: eventUri,
          }),
        },
      )

      const data = await response.json()
      console.log('📥 API Response:', data)

      if (response.ok) {
        toast.success('✅ Session Canceled & Moved to Archive!')

        // ✅ Remove the canceled session from the UI
        setCalendlyBookings((prev) => prev.filter((b) => b.calendlyEventUri !== eventUri))

        // ✅ Fetch updated archived classes
        fetchArchivedClasses()

        setSelectedEventUri(null)

        setShowCancelPopup(false)
        setPopupKey((prevKey) => prevKey + 1) // Force re-render
      } else {
        console.warn('⚠️ API returned an error:', data.message)

        // ✅ Show error message only for real API errors
        if (data.message && data.message.includes('already canceled')) {
          toast.info('⚠️ This session was already canceled.')
        }
      }
    } catch (error) {
      console.error('❌ Error canceling session:', error.message)
    }
  }

  const openReschedulePopup = (eventUri) => {
    setSelectedRescheduleEvent(eventUri)
    setShowReschedulePopup(true)
  }

  const formatDateTime = (dateString, sessionTimezone = 'UTC') => {
    if (!dateString) return 'Invalid Date' // ✅ Prevent errors if date is missing

    try {
      // ✅ Ensure the date is parsed correctly
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        console.error('❌ Invalid date value:', dateString)
        return 'Invalid Date'
      }

      // ✅ Convert stored UTC time to user's local timezone
      return new Intl.DateTimeFormat('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // ✅ Use User's OS Timezone
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date)
    } catch (error) {
      console.error('❌ Error formatting date:', error)
      return 'Invalid Date'
    }
  }

   // Ensuring proxyBookingLink is valid
   const renderBookNowButton = (classItem) => {
    if (!classItem.proxyBookingLink) {
      handleError('No booking link available.');
      return null;
    }

    return (
      <div className="mt-3">
        <a
          href={classItem.proxyBookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white bg-blue-600 hover:bg-blue-700 font-medium px-4 py-2 rounded-lg block text-center"
        >
          📅 Book Now
        </a>
      </div>
    );
  };


  if (loading && !user) return <p>Loading dashboard...</p>

  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="flex min-h-auto">
      <Toaster position="top-right" />

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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                {coupons.map((coupon, index) => (
                  <div key={index} className="p-4 bg-green-200 rounded-lg shadow">
                    <p>
                      <strong>💰 Coupon Code:</strong> {coupon.code}
                    </p>
                    <p>
                      <strong>🎯 Discount:</strong> {coupon.percent_off}% Off
                    </p>
                    {/* ✅ Conditional Text Based on Discount Percentage */}
                    <div className="mt-2 text-gray-700 items-center">
                      {coupon.percent_off === 100 ? (
                        <div className="flex flex-col space-y-1 ">
                          <p className="flex items-center">
                            ⚡{' '}
                            <span className="ml-2">
                              Applicable for only <strong>"60 Minute Tutoring Session"</strong>
                            </span>
                          </p>
                          <p className="ml-2">
                            📍 Located on the <strong>"Tutoring"</strong> page services
                          </p>
                          <p className="flex items-center text-red-600">
                            ❌{' '}
                            <span className="ml-2">
                              Not applicable for <strong>"Group Tutoring"</strong> services
                            </span>
                          </p>
                        </div>
                      ) : (
                        <p className="flex items-center">
                          ✅ <span className="ml-2">Applicable for all </span>{' '}
                          <span> "Tutoring" page services</span>
                        </p>
                      )}
                    </div>
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
                    {/* <div className="flex items-center mt-3 space-x-4">
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
                    </div> */}

                    {/* ✅ Display Admin Notes Below View on Calendly */}
                    {booking.note && (
                      <div className="mt-3 p-3 border border-gray-300 rounded bg-gray-100">
                        <h5 className="text-gray-800 font-bold">📌 Admin Note:</h5>
                        <p className="text-gray-700">{booking.note}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-3">
                      {/* Cancel Button */}
                      <button
                        className="flex-1 bg-red-500 text-white font-medium px-4 py-2 rounded-lg transition hover:bg-red-600"
                        onClick={() => confirmCancel(booking.calendlyEventUri)} // ✅ Correctly passing event URI
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
          {/* ✅ Display Zoom Sessions */}
          {zoomBookings.length > 0 && (
            <section className="mt-6 p-6 bg-white shadow-lg rounded-lg">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                🎥 Your Registered Zoom Sessions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {zoomBookings.map((session, index) => (
                  <div
                    key={index}
                    className="p-5 bg-white rounded-xl shadow-lg border border-gray-200"
                  >
                    {/* Session Title */}
                    <h4 className="text-xl font-semibold text-blue-700 mb-2">
                      {session.eventName || 'Unnamed Session'}
                    </h4>

                    {/* Show all session dates */}
                    <p className="font-semibold text-gray-700">📅 Session Dates:</p>
                    {session.sessionDates && session.sessionDates.length > 0 ? (
                      session.sessionDates.map((date, i) => (
                        <p key={i} className="text-gray-600">
                          🕒 {formatDateTime(date, session.timezone)}
                        </p>
                      ))
                    ) : (
                      <p className="text-red-500">⚠️ No scheduled dates found</p>
                    )}

                    {/* Zoom Meeting Link */}
                    {session.zoomMeetingLink && (
                      <div className="mt-3">
                        <a
                          href={session.zoomMeetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 font-medium hover:underline"
                        >
                          🔗 Join Zoom Session
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ✅ Show Remaining Sessions - Hide "Learn", but display other sessions */}
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

                     {/* Render "Book Now" button only if proxyBookingLink is available */}
                  {renderBookNowButton(classItem)}
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
              timeFormat="hh:mm aa" // ✅ Change to 12-hour format with AM/PM
              timeIntervals={30}
              dateFormat="MMMM d, yyyy h:mm aa"
              className="border p-2 mt-2"
              filterDate={(date) => {
                const day = date.getDay()
                return day >= 0 && day <= 4 // ✅ Allow only Sunday (0) to Thursday (4)
              }}
              minDate={new Date()} // ✅ Prevent past dates from being selected
              disabledKeyboardNavigation // ✅ Prevent user from manually typing invalid dates
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
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => cancelBooking(selectedEventUri)} // ✅ Use selectedEventUri here
              >
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
