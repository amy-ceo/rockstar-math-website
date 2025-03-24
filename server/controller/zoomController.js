const crypto = require('crypto')
const Register = require('../models/registerModel')
const cron = require('node-cron')

/**
 * 1) Auto-archive any Zoom dates that are in the past
 */
const archiveExpiredZoomSessions = async () => {
  try {
    console.log('🔄 Running Zoom auto-archiving process...')

    const users = await Register.find()
    const currentDate = new Date()

    for (const user of users) {
      let updatedZoomBookings = []
      let archivedSessions = []

      // Go through each Zoom booking
      for (const session of user.zoomBookings) {
        // futureSessions => dates that haven't passed yet
        const futureSessions = session.sessionDates.filter(
          (dateObj) => new Date(dateObj.date) >= currentDate,
        )
        // expiredSessions => any date that is in the past
        const expiredSessions = session.sessionDates.filter(
          (dateObj) => new Date(dateObj.date) < currentDate,
        )

        // Archive each expired date
        for (const dateObj of expiredSessions) {
          archivedSessions.push({
            name: session.eventName,
            description: 'Session date has passed',
            archivedAt: new Date(),
            sessionDate: new Date(dateObj.date).toISOString(),
            zoomMeetingLink: session.zoomMeetingLink,
            source: 'zoom',
          })
        }

        // Keep only future dates in the session
        if (futureSessions.length > 0) {
          session.sessionDates = futureSessions
          updatedZoomBookings.push(session)
        }
      }

      // Overwrite user’s zoomBookings with the future ones
      user.zoomBookings = updatedZoomBookings

      // Append archived items
      user.archivedClasses.push(...archivedSessions)

      user.markModified('archivedClasses')
      user.markModified('zoomBookings')
      await user.save()
    }

    console.log('✅ Auto-archiving of expired Zoom sessions completed!')
  } catch (error) {
    console.error('❌ Error auto-archiving Zoom sessions:', error)
  }
}

// Run daily at midnight
cron.schedule('0 0 * * *', archiveExpiredZoomSessions)

/**
 * 2) Zoom Webhook Endpoint
 *    - For new Zoom registrations, etc.
 */
exports.zoomWebhook = async (req, res) => {
  try {
    console.log('📢 Headers:', req.headers)
    console.log('📢 Request IP:', req.headers['x-forwarded-for'] || req.connection.remoteAddress)
    console.log('📢 Full Payload:', JSON.stringify(req.body, null, 2))

    // Convert Buffer Body to JSON if needed
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString('utf8'))
    }

    // Handle Zoom URL Validation
    if (req.body.event === 'endpoint.url_validation' && req.body.payload?.plainToken) {
      console.log('✅ Sending Validation Response:', req.body.payload.plainToken)

      let encryptedToken = crypto
        .createHmac('sha256', process.env.ZOOM_EVENT_VALIDATION_TOKEN)
        .update(req.body.payload.plainToken)
        .digest('hex')

      return res.status(200).json({
        plainToken: req.body.payload.plainToken,
        encryptedToken: encryptedToken,
      })
    }

    console.log('🔹 Received a Non-Validation Webhook Event:', req.body.event)

    // Ensure valid payload
    if (!req.body.payload || !req.body.payload.object) {
      console.error('❌ Invalid Webhook Payload:', req.body)
      return res.status(400).json({ error: 'Invalid Webhook Payload - Missing required fields' })
    }

    const payload = req.body.payload.object
    const registrant = payload.registrant || {}
    const inviteeEmail = registrant.email || null
    const meetingTopic = payload.topic || 'Unknown Topic'
    const meetingId = payload.id || 'Unknown ID'
    const joinUrl = registrant.join_url || 'No Join URL Provided'

    const startTime = payload.start_time ? new Date(payload.start_time) : null

    if (!inviteeEmail || !startTime) {
      console.error('❌ Missing required data:', { inviteeEmail, startTime })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Find the user (case-insensitive match on billingEmail)
    const user = await Register.findOne({
      billingEmail: new RegExp(`^${inviteeEmail}$`, 'i'),
    }).exec()
    if (!user) {
      console.error('❌ No user found with email:', inviteeEmail)
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate Weekly Session Dates (every 7 days backward from startTime)
    const sessionDates = []
    let dateIterator = new Date(startTime)
    const today = new Date()

    while (dateIterator >= today) {
      sessionDates.push(dateIterator.toISOString())
      dateIterator.setDate(dateIterator.getDate() - 7)
    }
    sessionDates.reverse()
    console.log('✅ Generated Session Dates:', sessionDates)

    // Check if the Zoom event already exists
    let existingMeeting = user.zoomBookings.find((booking) => booking.zoomMeetingId === meetingId)

    if (existingMeeting) {
      if (!existingMeeting.sessionDates) {
        existingMeeting.sessionDates = []
      }

      // Add new session dates if not already present
      sessionDates.forEach((dateStr) => {
        if (
          !existingMeeting.sessionDates.some(
            (storedDateObj) =>
              new Date(storedDateObj.date).getTime() === new Date(dateStr).getTime(),
          )
        ) {
          existingMeeting.sessionDates.push({
            date: new Date(dateStr).toISOString(),
            note: '',
            status: 'Booked',
          })
        }
      })

      user.markModified('zoomBookings')
      await user.save()
      console.log('✅ Updated existing Zoom booking with new session dates.')
    } else {
      // Create a new Zoom booking
      const newZoomBooking = {
        eventName: meetingTopic,
        firstName: registrant.first_name || 'N/A',
        lastName: registrant.last_name || 'N/A',
        zoomMeetingId: meetingId,
        zoomMeetingLink: joinUrl,
        sessionDates: sessionDates.map((dateStr) => ({
          date: new Date(dateStr).toISOString(),
          note: '',
          status: 'Booked',
        })),
        timezone: payload.timezone || 'UTC',
        status: 'Booked',
      }

      user.zoomBookings.push(newZoomBooking)
      await user.save()
      console.log('✅ Successfully stored new Zoom booking.')
    }

    return res.status(200).json({ message: 'Zoom Booking stored successfully', updatedUser: user })
  } catch (error) {
    console.error('❌ Error handling Zoom webhook:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * 3) Fetch a user's Zoom bookings
 */
exports.getUserZoomBookings = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const user = await Register.findById(userId).select('zoomBookings').exec()
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Ensure sessionDates is always an array
    const zoomBookings = user.zoomBookings.map((booking) => ({
      ...booking.toObject(),
      sessionDates: Array.isArray(booking.sessionDates) ? booking.sessionDates : [],
    }))

    return res.status(200).json({
      message: 'Zoom bookings fetched successfully',
      zoomBookings,
    })
  } catch (error) {
    console.error('❌ Error fetching Zoom bookings:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

/**
 * 4) Cancel a single Zoom date and archive it
 *    (If no dates remain, the entire session is removed from zoomBookings.)
 */
exports.cancelZoomSession = async (req, res) => {
  try {
    const { userId, sessionId, sessionDate } = req.body

    if (!userId || !sessionId || !sessionDate) {
      return res.status(400).json({ message: 'Missing required parameters' })
    }

    console.log(`🔍 Searching for user ${userId}...`)
    const user = await Register.findById(userId)
    if (!user) {
      console.error('❌ User not found!')
      return res.status(404).json({ message: 'User not found' })
    }

    console.log(`🔍 Searching for Zoom Session with ID: ${sessionId}`)
    const sessionIndex = user.zoomBookings.findIndex(
      (session) => session._id.toString() === sessionId,
    )
    if (sessionIndex === -1) {
      console.error('❌ Session not found!')
      return res.status(404).json({ message: 'Session not found' })
    }

    let session = user.zoomBookings[sessionIndex]
    console.log(`✅ Found session: ${session.eventName}`)

    // Format the provided sessionDate
    const formattedSessionDate = new Date(sessionDate).toISOString()

    // 1) Remove the single canceled date from sessionDates
    session.sessionDates = session.sessionDates.filter(
      (dateObj) => new Date(dateObj.date).toISOString() !== formattedSessionDate,
    )
    console.log(`🔹 Remaining session dates after removal:`, session.sessionDates)

    // 2) Archive THIS single canceled date right away
    const archivedDate = {
      name: session.eventName,
      description: 'Zoom session date was canceled by user',
      archivedAt: new Date(),
      sessionDate: formattedSessionDate,
      zoomMeetingLink: session.zoomMeetingLink || null,
      source: 'zoom',
    }
    user.archivedClasses.push(archivedDate)

    // 3) If no dates remain, remove the entire session
    if (session.sessionDates.length === 0) {
      console.log('✅ No more session dates left, removing the entire session from zoomBookings...')
      user.zoomBookings.splice(sessionIndex, 1)
    } else {
      // Otherwise, keep the updated session
      user.zoomBookings[sessionIndex] = session
    }

    user.markModified('archivedClasses')
    user.markModified('zoomBookings')
    await user.save()

    // Re-fetch archivedClasses for the response
    const updatedUser = await Register.findById(userId).select('archivedClasses')
    console.log(
      '✅ Final Archived Classes in DB:',
      JSON.stringify(updatedUser.archivedClasses, null, 2),
    )

    // 4) Respond with success
    return res.status(200).json({
      message: 'Zoom date canceled and archived successfully',
      archivedClasses: updatedUser.archivedClasses,
    })
  } catch (error) {
    console.error('❌ Error canceling Zoom session:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
