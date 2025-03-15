const Register = require('../models/registerModel')
const sendEmail = require('../utils/emailSender')

exports.calendlyWebhook = async (req, res) => {
  try {
    console.log('📢 Webhook Received!')
    console.log('📢 Incoming Headers:', JSON.stringify(req.headers, null, 2))
    console.log('📢 Raw Webhook Body:', JSON.stringify(req.body, null, 2))

    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ ERROR: Empty Webhook Payload')
      return res.status(400).json({ error: 'Empty Webhook Payload' })
    }

    if (!req.body.payload) {
      console.error('❌ ERROR: req.body.payload is missing', req.body)
      return res.status(400).json({ error: 'Invalid Webhook Payload - Missing `payload` object' })
    }

    const payload = req.body.payload
    const inviteeEmail = payload?.email || '❌ Missing'
    const eventName = payload?.event?.name || '❌ Missing'
    const eventUri = payload?.event?.uri || '❌ Missing'
    const startTime = payload?.event?.start_time ? new Date(payload.event.start_time) : null
    const endTime = payload?.event?.end_time ? new Date(payload.event.end_time) : null
    const timezone = payload?.timezone || 'America/Los_Angeles'

    console.log('✅ Extracted Data:', {
      inviteeEmail,
      eventName,
      eventUri,
      startTime,
      endTime,
      timezone,
    })

    if (
      inviteeEmail === '❌ Missing' ||
      eventName === '❌ Missing' ||
      eventUri === '❌ Missing' ||
      !startTime ||
      !endTime
    ) {
      console.error('❌ ERROR: Missing required data:', {
        inviteeEmail,
        eventName,
        eventUri,
        startTime,
        endTime,
      })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizeUrl = (url) => url?.split('?')[0].trim().toLowerCase()
    const normalizedEventUri = eventUri !== '❌ Missing' ? normalizeUrl(eventUri) : null

    const user = await Register.findOne({
      $or: [{ billingEmail: inviteeEmail }, { schedulingEmails: inviteeEmail }],
    })

    if (!user) {
      console.error('❌ No user found:', inviteeEmail)
      return res.status(404).json({ error: 'User not found' })
    }

    if (!normalizedEventUri) {
      console.error('❌ Missing valid Calendly Event URI')
      return res.status(400).json({ error: 'Invalid or missing Calendly Event URL' })
    }

    const eventAlreadyExists = user.bookedSessions.some(
      (session) => normalizeUrl(session.calendlyEventUri) === normalizedEventUri,
    )

    if (eventAlreadyExists) {
      console.log(`⚠️ Duplicate Event Detected: ${eventName}. Skipping Booking.`)
      return res.status(200).json({ message: 'Event already stored, skipping' })
    }

    let purchasedClass = user.purchasedClasses.find(
      (cls) => cls.status === 'Active' && normalizeUrl(cls.bookingLink) === normalizedEventUri,
    )

    if (!purchasedClass && user.purchasedClasses.length > 0) {
      purchasedClass = user.purchasedClasses[0]
      purchasedClass.bookingLink = normalizedEventUri
      purchasedClass.description = purchasedClass.description || 'Calendly Booking'
      user.markModified('purchasedClasses')
      await user.save()
    }

    // ✅ Check if User Has Remaining Sessions
    // ✅ Ensure User Has Remaining Sessions
    if (purchasedClass.remainingSessions <= 0) {
      return res.status(403).json({ error: 'You have no remaining sessions left.' })
    }

    purchasedClass.remainingSessions -= 1
    user.bookedSessions.push({
      eventName,
      calendlyEventUri: eventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    })
    await user.save()

    if (purchasedClass.remainingSessions === 0) {
      purchasedClass.status = 'Expired'
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

    console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2))

    // ✅ Update User's bookedSessions
    user.bookedSessions.push(newBooking)

    // ✅ Save User with the updated session and class data
    await user.save()

    console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`)
    console.log(`✅ Session Booked: Remaining ${purchasedClass.remainingSessions} sessions.`)

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
    const recipientEmails = recipients.join(',')

    // ✅ Email Content
    const emailSubject = `📅 Your RockstarMath Booking Confirmation`
    const emailHtml = `
       <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; color: #333; background: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
           <h2 style="color: #2C3E50;">📅 Your Session is Booked!</h2>
           <p>Hi <b>${user.username}</b>,</p>
           <p>Your session "<b>${eventName}</b>" has been successfully booked.</p>
           <p><b>Start Time:</b> ${startTime.toLocaleString()}</p>
           <p><b>End Time:</b> ${endTime.toLocaleString()}</p>
           <p><b>Time Zone:</b> ${timezone}</p>
           <p><b>Event Link:</b> <a href="${eventUri}" target="_blank">${eventUri}</a></p>
           <p>You have <b>${purchasedClass.remainingSessions}</b> sessions remaining.</p>
           <p>If you have any questions, contact us at <b>rockstarmathtutoring@gmail.com</b></p>
           <p>Best Regards,<br>Rockstar Math Tutoring</p>
       </div>
     `

    await sendEmail(recipientEmails, emailSubject, '', emailHtml)
    console.log(`✅ Booking confirmation email sent to ${recipientEmails}`)

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
