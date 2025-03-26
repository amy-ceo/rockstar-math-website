const Register = require('../models/registerModel')
const sendEmail = require('../utils/emailSender')

exports.calendlyWebhook = async (req, res) => {
  try {
    console.log('📢 Webhook Received - Headers:', req.headers)
    console.log('📢 Raw Webhook Body:', req.body)

    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ Empty Webhook Payload')
      return res.status(400).json({ error: 'Empty Webhook Payload' })
    }

    // Enhanced payload extraction with fallbacks
    const payload = req.body.payload || req.body
    console.log('📢 Processed Payload:', JSON.stringify(payload, null, 2))

    // ✅ Robust extraction of invitee email
    const inviteeEmail =
      payload?.email || payload?.invitee?.email || payload?.event?.invitee?.email || '❌ Missing'
    console.log('📧 Extracted Invitee Email:', inviteeEmail)

    // ✅ Event details with better fallbacks
    const eventName =
      payload?.event_type?.name || payload?.event?.name || payload?.name || '❌ Missing'

    const eventUri = payload?.event?.uri || payload?.event_type?.uri || payload?.uri || '❌ Missing'
    console.log('🎯 Event Details:', { eventName, eventUri })

    // Normalize URL comparison
    const normalizeUrl = (url) => url?.split('?')[0].trim().toLowerCase()
    const normalizedEventUri = eventUri !== '❌ Missing' ? normalizeUrl(eventUri) : null

    // ✅ Time handling with validation
    let startTime, endTime
    try {
      startTime = new Date(
        payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time,
      )

      endTime = new Date(
        payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time,
      )

      if (isNaN(startTime.getTime())) {
        throw new Error('Invalid start time')
      }
      if (isNaN(endTime.getTime())) {
        endTime = new Date(startTime.getTime() + 30 * 60000) // Default 30 min
      }
    } catch (timeError) {
      console.error('⏰ Time Parsing Error:', timeError)
      return res.status(400).json({ error: 'Invalid time data' })
    }

    const timezone = payload?.timezone || payload?.event?.timezone || 'America/Los_Angeles'

    // ✅ Validation
    if (inviteeEmail === '❌ Missing' || !startTime || !eventUri) {
      console.error('❌ Missing required fields:', {
        inviteeEmail,
        startTime,
        eventUri,
      })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // ✅ Find user with email matching
    const user = await Register.findOne({
      $or: [
        { billingEmail: inviteeEmail },
        { schedulingEmails: inviteeEmail },
        { schedulingEmails: { $elemMatch: { $eq: inviteeEmail } } }, // If array
      ],
    })

    if (!user) {
      console.error('❌ No user found with email:', inviteeEmail)
      console.log(
        'Available emails in system:',
        await Register.find({}, 'billingEmail schedulingEmails'),
      )
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('👤 Found User:', user._id)

    // Check for duplicate event
    const existingBooking = user.bookedSessions.find(
      (session) => normalizeUrl(session.calendlyEventUri) === normalizedEventUri,
    )

    if (existingBooking) {
      console.log("⚠️ Duplicate event - already exists in user's bookings")
      return res.status(200).json({ message: 'Event already exists' })
    }

    // Find matching purchased class
    let purchasedClass = user.purchasedClasses.find(
      (cls) =>
        cls.status === 'Active' &&
        (normalizeUrl(cls.bookingLink) === normalizedEventUri ||
          normalizeUrl(cls.proxyBookingLink)?.includes(encodeURIComponent(eventName))),
    )

    if (!purchasedClass && user.purchasedClasses.length > 0) {
      console.log('🔍 No exact class match, using first active class')
      purchasedClass = user.purchasedClasses.find((cls) => cls.status === 'Active')
    }

    // Create new booking
    const newBooking = {
      eventName,
      calendlyEventUri: eventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    }

    // Update user
    if (purchasedClass) {
      purchasedClass.remainingSessions = Math.max(purchasedClass.remainingSessions - 1, 0)
      if (purchasedClass.remainingSessions <= 0) {
        purchasedClass.status = 'Expired'
      }
      user.markModified('purchasedClasses')
    }

    user.bookedSessions.push(newBooking)
    await user.save()

    console.log('✅ Successfully stored booking:', newBooking)
    console.log('🔄 Updated user:', {
      bookedSessions: user.bookedSessions.length,
      purchasedClasses: user.purchasedClasses,
    })

    // Send confirmation email
    let recipients = [user.billingEmail]
    if (user.schedulingEmails) {
      if (Array.isArray(user.schedulingEmails)) {
        recipients = recipients.concat(user.schedulingEmails)
      } else {
        recipients.push(user.schedulingEmails)
      }
    }
    recipients = recipients.filter((email) => email)

    res.status(200).json({
      message: 'Booking stored successfully',
      booking: newBooking,
    })
  } catch (error) {
    console.error('❌ Webhook Error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
    })
  }
}

exports.getCalendlyBookings = async (req, res) => {
  try {
    const { userId } = req.params
    console.log('🔍 Checking UserId:', userId)

    const user = await Register.findById(userId)
    if (!user) {
      console.error('❌ User not found with ID:', userId)
      return res.status(404).json({ message: 'User not found' })
    }

    console.log('✅ Retrieved user data:', {
      id: user._id,
      bookedSessionsCount: user.bookedSessions.length,
    })

    res.status(200).json({
      bookings: user.bookedSessions || [],
      purchasedClasses: user.purchasedClasses,
    })
  } catch (error) {
    console.error('❌ Error fetching bookings:', error)
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    })
  }
}
