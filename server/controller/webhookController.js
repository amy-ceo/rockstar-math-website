const Register = require('../models/registerModel')

exports.calendlyWebhook = async (req, res) => {
  try {
    console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2))

    if (!req.body || !req.body.payload) {
      console.error('❌ Invalid Webhook Payload:', req.body)
      return res.status(400).json({ error: 'Invalid Webhook Payload' })
    }

    const payload = req.body.payload

    // ✅ Extract Invitee & Event Details
    const inviteeEmail = payload?.email || '❌ Missing'
    const eventName = payload?.name || payload?.event?.name || '❌ Missing'
    const eventUri = payload?.uri || payload?.event?.uri || '❌ Missing'

    // ✅ Fix: Extract `startTime` from multiple possible locations
    const startTime =
      payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time
        ? new Date(
            payload?.start_time ||
              payload?.event?.start_time ||
              payload?.scheduled_event?.start_time,
          )
        : null

    const endTime =
      payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time
        ? new Date(
            payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time,
          )
        : startTime
        ? new Date(startTime.getTime() + 30 * 60000) // Default to 30 min duration
        : null

    const timezone = payload?.timezone || payload?.event?.location?.timezone || '❌ Missing'

    // ✅ Validation: Ensure required fields are present
    if (inviteeEmail === '❌ Missing' || !startTime || !endTime) {
      console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // ✅ Find user in MongoDB using invitee email
    const user = await Register.findOne({ billingEmail: inviteeEmail })

    if (!user) {
      console.error('❌ No user found:', inviteeEmail)
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('👤 User Found:', user)

    // ✅ Check if Event Already Exists in User's bookedSessions (Avoid Duplicates)
    const eventAlreadyExists = user.bookedSessions.some(
      (session) => session.calendlyEventUri === eventUri,
    )

    if (eventAlreadyExists) {
      console.log(`⚠️ Event Already Exists in User Bookings: ${eventName}`)
      return res.status(200).json({ message: 'Event already stored, skipping' })
    }
    // ✅ Find Purchased Plan for this Event
    let purchasedPlan = user.purchasedClasses.find((item) => item.name === eventName)

    // ✅ Ensure User Has Remaining Sessions
    if (purchasedPlan.remainingSessions <= 0) {
      console.error(`❌ No remaining sessions left for plan: ${eventName}`)
      return res.status(400).json({ error: `You have no remaining sessions left for ${eventName}` })
    }

    // ✅ Decrement Remaining Sessions
    purchasedPlan.remainingSessions -= 1

    // ✅ Create New Booking Object (Following User's `bookedSessions` Schema)
    const newBooking = {
      eventName,
      calendlyEventUri: eventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    }

    console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2))

    // ✅ Update User's bookedSessions
    user.bookedSessions.push(newBooking)

    await user.save()
    console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`)

    res.status(200).json({ message: 'Booking stored successfully', updatedUser: user })
  } catch (error) {
    console.error('❌ Error handling Calendly webhook:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
exports.getCalendlyBookings = async (req, res) => {
  try {
    const { userId } = req.params

    console.log('🔍 Checking UserId:', userId) // Debugging log

    // Find user in MongoDB
    const user = await Register.findById(userId)

    console.log('✅ Retrieved user data:', JSON.stringify(user, null, 2)) // Debugging log

    if (!user) {
      console.error('❌ User not found with ID:', userId)
      return res.status(404).json({ message: 'User not found' })
    }

    // ✅ Return bookedSessions from the user
    res.status(200).json({ bookings: user.bookedSessions || [] })
  } catch (error) {
    console.error('❌ Error fetching bookings:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

exports.cancelSession = async (req, res) => {
  try {
    const { userId, eventUri } = req.body

    // ✅ Find user
    const user = await Register.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // ✅ Find the session to cancel
    const sessionIndex = user.bookedSessions.findIndex(
      (session) => session.calendlyEventUri === eventUri,
    )
    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Session not found' })
    }

    const canceledSession = user.bookedSessions[sessionIndex]

    // ✅ Restore Session Count
    let purchasedPlan = user.purchasedClasses.find(
      (item) => item.name === canceledSession.eventName,
    )
    if (purchasedPlan) {
      purchasedPlan.remainingSessions += 1 // Increase count back
    }

    // ✅ Remove session from bookedSessions
    user.bookedSessions.splice(sessionIndex, 1)
    await user.save()

    console.log(`✅ Session canceled by ${user.billingEmail}: ${canceledSession.eventName}`)

    // ✅ Send email to Admin
    const emailContent = `
                <h3>🚨 Session Canceled</h3>
                <p><strong>User:</strong> ${user.billingEmail}</p>
                <p><strong>Session:</strong> ${canceledSession.eventName}</p>
                <p><strong>Time:</strong> ${new Date(
                  canceledSession.startTime,
                ).toLocaleString()}</p>
            `

    await sendEmail('anchorwebdesigner@gmail.com', '🚨 Session Canceled', '', emailContent)

    res.status(200).json({ message: 'Session canceled successfully' })
  } catch (error) {
    console.error('❌ Error canceling session:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
