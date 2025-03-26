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

    // ✅ Check if Event Already Exists in User's bookedSessions (Avoid Duplicates)
    const eventAlreadyExists = user.bookedSessions.some(
      (session) => normalizeUrl(session.calendlyEventUri) === normalizedEventUri,
    )

    if (eventAlreadyExists) {
      console.log(`⚠️ Duplicate Event Detected: ${eventName}. Skipping Booking.`)
      return res.status(200).json({ message: 'Event already stored, skipping' })
    }

    // ✅ Find Matching Purchased Class
    let purchasedClass = user.purchasedClasses.find(
      (cls) => cls.status === 'Active' && normalizeUrl(cls.bookingLink) === normalizedEventUri,
    )

    // ✅ If no valid purchased class, assign first available class
    if (!purchasedClass && user.purchasedClasses.length > 0) {
      purchasedClass =
        user.purchasedClasses.find((cls) => cls.status === 'Active') || user.purchasedClasses[0]

      // ✅ Update booking link in database
      purchasedClass.bookingLink = normalizedEventUri
      purchasedClass.description = purchasedClass.description || 'Calendly Booking'
      user.markModified('purchasedClasses')
      await user.save()

      console.log(`🔄 Updated booking link to: ${normalizedEventUri}`)
    }

    // ✅ Remove Session Deduction: Allow Booking Even if Sessions Are 0
    if (purchasedClass) {
      purchasedClass.remainingSessions = Math.max(purchasedClass.remainingSessions - 1, 0) // Prevent negative sessions
      user.markModified('purchasedClasses')

      if (purchasedClass.remainingSessions === 0) {
        purchasedClass.status = 'Expired'
      }
    } else {
      console.warn(`⚠️ No purchased class found. Booking will still proceed.`)
    }

    // ✅ Create New Booking Object
    const newBooking = {
      eventName,
      calendlyEventUri: eventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    }

    console.log('Storing New Booking:', JSON.stringify(newBooking, null, 2))

    // ✅ Update User's bookedSessions
    user.bookedSessions.push(newBooking)

    // ✅ Save User with the updated session and class data
    await user.save()

    console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`)

    // ✅ **Send Confirmation Email to Billing & Scheduling Emails**
    let recipients = [user.billingEmail]

    if (user.schedulingEmails) {
      if (Array.isArray(user.schedulingEmails)) {
        recipients = recipients.concat(user.schedulingEmails)
      } else {
        recipients.push(user.schedulingEmails)
      }
    }

    recipients = recipients.filter((email) => email) // Remove null/undefined values

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
