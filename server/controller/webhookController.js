const Register = require('../models/registerModel')

exports.calendlyWebhook = async (req, res) => {
    try {
      console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2))
  
      if (!req.body || !req.body.payload) {
        console.error('❌ Invalid Webhook Payload:', req.body)
        return res.status(400).json({ error: 'Invalid Webhook Payload' })
      }
  
      const payload = req.body.payload
  
      // ✅ Extract Invitee & Event Details (Ensuring Safe Extraction)
      const inviteeEmail = payload?.email || '❌ Missing'
      const eventName = payload?.name || payload?.event?.name || '❌ Missing'
      const eventUri = payload?.uri || payload?.event?.uri || '❌ Missing'
      const cancelUrl = payload?.cancel_url || null // ✅ Detect if session is being rescheduled
  
      // ✅ Extract Start and End Time (Handles Undefined & Fallbacks)
      const startTime = payload?.start_time
        ? new Date(payload.start_time)
        : payload?.event?.start_time
        ? new Date(payload.event.start_time)
        : null
  
      const endTime = payload?.end_time
        ? new Date(payload.end_time)
        : startTime
        ? new Date(startTime.getTime() + 30 * 60000) // Default to 30 min duration
        : null
  
      const timezone = payload?.timezone || payload?.event?.timezone || '❌ Missing'
  
      // ✅ Validation: Ensure required fields are present
      if (!inviteeEmail || !startTime || !endTime) {
        console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime })
        return res.status(400).json({ error: 'Missing required fields' })
      }
  
      // ✅ Find User
      const user = await Register.findOne({ billingEmail: inviteeEmail })
  
      if (!user) {
        console.error('❌ No user found:', inviteeEmail)
        return res.status(404).json({ error: 'User not found' })
      }
  
      console.log('👤 User Found:', user)
  
      // ✅ **1️⃣ Handle Rescheduling**
      if (cancelUrl) {
        // Find the existing session that was canceled
        const oldSessionIndex = user.bookedSessions.findIndex(
          (session) => session.calendlyEventUri === cancelUrl
        )
  
        if (oldSessionIndex !== -1) {
          // ✅ **Update existing session with new details**
          user.bookedSessions[oldSessionIndex] = {
            eventName,
            calendlyEventUri: eventUri,
            startTime,
            endTime,
            timezone,
            status: 'Rescheduled',
            createdAt: new Date()
          }
  
          console.log(`🔄 ✅ Session Rescheduled for: ${eventName}`)
  
          // ✅ Send Email Notification
          const emailContent = `
                      <h3>🔄 Session Rescheduled</h3>
                      <p><strong>User:</strong> ${user.billingEmail}</p>
                      <p><strong>Session:</strong> ${eventName}</p>
                      <p><strong>New Time:</strong> ${new Date(startTime).toLocaleString()}</p>
                      <p><strong>Timezone:</strong> ${timezone}</p>
                  `
          await sendEmail('admin@example.com', '🔄 Session Rescheduled', '', emailContent)
  
          await user.save()
          return res
            .status(200)
            .json({ message: 'Session rescheduled successfully', updatedUser: user })
        }
      }
  
      // ✅ **2️⃣ Find Purchased Plan**
      let purchasedPlan = user.purchasedClasses.find((item) =>
        eventName.trim().toLowerCase().includes(item.name.trim().toLowerCase())
      )
  
      if (!purchasedPlan) {
        console.error(`❌ No matching purchased plan found for event: ${eventName}`)
        return res.status(400).json({ error: `No matching plan found for ${eventName}` })
      }
  
      // ✅ **3️⃣ Ensure `sessionCount` and `remainingSessions` exist**
      if (!purchasedPlan.sessionCount) {
        console.warn(`⚠️ "sessionCount" missing for ${eventName}, setting default.`)
        purchasedPlan.sessionCount = 8 // Default
      }
      if (!purchasedPlan.remainingSessions) {
        purchasedPlan.remainingSessions = purchasedPlan.sessionCount
      }
  
      // ✅ **4️⃣ Ensure User Has Remaining Sessions**
      if (purchasedPlan.remainingSessions <= 0) {
        console.error(`❌ No remaining sessions left for plan: ${eventName}`)
        return res.status(400).json({ error: `You have no remaining sessions left for ${eventName}` })
      }
  
      // ✅ **5️⃣ Prevent Duplicate Session Booking**
      const alreadyBooked = user.bookedSessions.some(
        (session) => session.calendlyEventUri === eventUri
      )
      if (alreadyBooked) {
        console.warn(`⚠️ Session already booked for ${eventName}, skipping duplicate entry.`)
        return res.status(200).json({ message: 'Session already booked, skipping duplicate entry.' })
      }
  
      // ✅ **6️⃣ Decrement Remaining Sessions**
      purchasedPlan.remainingSessions -= 1
  
      // ✅ **7️⃣ Create New Booking**
      const newBooking = {
        eventName,
        calendlyEventUri: eventUri,
        startTime,
        endTime,
        timezone,
        status: 'Booked',
        createdAt: new Date()
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
              <p><strong>Time:</strong> ${new Date(canceledSession.startTime).toLocaleString()}</p>
          `

    await sendEmail('anchorwebdesigner@gmail.com', '🚨 Session Canceled', '', emailContent)

    res.status(200).json({ message: 'Session canceled successfully' })
  } catch (error) {
    console.error('❌ Error canceling session:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
