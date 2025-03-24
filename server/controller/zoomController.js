const crypto = require('crypto')
const Register = require('../models/registerModel')
const cron = require('node-cron')

const archiveExpiredZoomSessions = async () => {
  try {
    console.log('🔄 Running Zoom auto-archiving process...');

    const users = await Register.find();
    const currentDate = new Date();

    users.forEach(async (user) => {
      let updatedZoomBookings = [];
      let archivedSessions = [];

      user.zoomBookings.forEach((session) => {
        // Filter based on the sub-document's date field
        let futureSessions = session.sessionDates.filter((dateObj) => new Date(dateObj.date) >= currentDate);
        let expiredSessions = session.sessionDates.filter((dateObj) => new Date(dateObj.date) < currentDate);

        if (expiredSessions.length > 0) {
          expiredSessions.forEach((dateObj) => {
            archivedSessions.push({
              name: session.eventName,
              description: 'Session date has passed',
              archivedAt: new Date(),
              sessionDate: new Date(dateObj.date).toISOString(), // use the sub-document date
              zoomMeetingLink: session.zoomMeetingLink,
              source: 'zoom', // Identify as Zoom session
            });
          });
        }

        if (futureSessions.length > 0) {
          // Replace sessionDates with the filtered array of objects
          session.sessionDates = futureSessions;
          updatedZoomBookings.push(session);
        }
      });

      user.zoomBookings = updatedZoomBookings;
      user.archivedClasses.push(...archivedSessions);

      // Mark fields as modified
      user.markModified('archivedClasses');
      user.markModified('zoomBookings');

      await user.save();
    });

    console.log('✅ Auto-archiving of expired Zoom sessions completed!');
  } catch (error) {
    console.error('❌ Error auto-archiving Zoom sessions:', error);
  }
}

// Run daily at midnight
cron.schedule('0 0 * * *', archiveExpiredZoomSessions);

// ✅ Run the function daily at midnight
cron.schedule('0 0 * * *', archiveExpiredZoomSessions)
exports.zoomWebhook = async (req, res) => {
  try {
    console.log('📢 Headers:', req.headers);
    console.log('📢 Request IP:', req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    console.log('📢 Full Payload:', JSON.stringify(req.body, null, 2));

    // Convert Buffer Body to JSON if necessary
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString('utf8'));
    }

    // Handle Zoom URL Validation
    if (req.body.event === 'endpoint.url_validation' && req.body.payload?.plainToken) {
      console.log('✅ Sending Validation Response:', req.body.payload.plainToken);

      let encryptedToken = crypto
        .createHmac('sha256', process.env.ZOOM_EVENT_VALIDATION_TOKEN)
        .update(req.body.payload.plainToken)
        .digest('hex');

      return res.status(200).json({
        plainToken: req.body.payload.plainToken,
        encryptedToken: encryptedToken,
      });
    }

    console.log('🔹 Received a Non-Validation Webhook Event:', req.body.event);

    // Ensure valid payload
    if (!req.body.payload || !req.body.payload.object) {
      console.error('❌ Invalid Webhook Payload:', req.body);
      return res.status(400).json({ error: 'Invalid Webhook Payload - Missing required fields' });
    }

    const payload = req.body.payload.object;
    const registrant = payload.registrant || {};
    const inviteeEmail = registrant.email || null;
    const meetingTopic = payload.topic || 'Unknown Topic';
    const meetingId = payload.id || 'Unknown ID';
    const joinUrl = registrant.join_url || 'No Join URL Provided';

    const startTime = payload.start_time ? new Date(payload.start_time) : null;

    if (!inviteeEmail || !startTime) {
      console.error('❌ Missing required data:', { inviteeEmail, startTime });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the user (case-insensitive match on billingEmail)
    const user = await Register.findOne({
      billingEmail: new RegExp(`^${inviteeEmail}$`, 'i'),
    }).exec();
    if (!user) {
      console.error('❌ No user found with email:', inviteeEmail);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate Weekly Session Dates (every 7 days)
    const sessionDates = [];
    let dateIterator = new Date(startTime);
    const today = new Date();

    while (dateIterator >= today) {
      sessionDates.push(dateIterator.toISOString());
      dateIterator.setDate(dateIterator.getDate() - 7);
    }
    sessionDates.reverse(); // Chronological order
    console.log('✅ Generated Session Dates:', sessionDates);

    // Check if the Zoom event already exists
    let existingMeeting = user.zoomBookings.find((booking) => booking.zoomMeetingId === meetingId);

    if (existingMeeting) {
      if (!existingMeeting.sessionDates) {
        existingMeeting.sessionDates = [];
      }

      // Add new session dates if not already present (as objects)
      sessionDates.forEach((dateStr) => {
        if (
          !existingMeeting.sessionDates.some(
            (storedDateObj) => new Date(storedDateObj.date).getTime() === new Date(dateStr).getTime()
          )
        ) {
          existingMeeting.sessionDates.push({
            date: new Date(dateStr).toISOString(),
            note: "",
            status: "Booked"
          });
        }
      });

      user.markModified('zoomBookings');
      await user.save();
      console.log('✅ Updated existing Zoom booking with new session dates.');
    } else {
      // Create a new Zoom booking; store each session date as an object
      const newZoomBooking = {
        eventName: meetingTopic,
        firstName: registrant.first_name || 'N/A',
        lastName: registrant.last_name || 'N/A',
        zoomMeetingId: meetingId,
        zoomMeetingLink: joinUrl,
        sessionDates: sessionDates.map((dateStr) => ({
          date: new Date(dateStr).toISOString(),
          note: "",
          status: "Booked"
        })),
        timezone: payload.timezone || 'UTC',
        status: 'Booked'
      };

      user.zoomBookings.push(newZoomBooking);
      await user.save();
      console.log('✅ Successfully stored new Zoom booking.');
    }

    return res.status(200).json({ message: 'Zoom Booking stored successfully', updatedUser: user });
  } catch (error) {
    console.error('❌ Error handling Zoom webhook:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
exports.getUserZoomBookings = async (req, res) => {
  try {
    const { userId } = req.params; // Get userId from request parameters

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find user by ID and fetch their zoomBookings only
    const user = await Register.findById(userId).select('zoomBookings').exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure sessionDates is an array of objects
    const zoomBookings = user.zoomBookings.map((booking) => ({
      ...booking.toObject(),
      sessionDates: Array.isArray(booking.sessionDates) ? booking.sessionDates : [],
    }));

    return res.status(200).json({
      message: 'Zoom bookings fetched successfully',
      zoomBookings,
    });
  } catch (error) {
    console.error('❌ Error fetching Zoom bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


exports.cancelZoomSession = async (req, res) => {
  try {
    const { userId, sessionId, sessionDate } = req.body;

    if (!userId || !sessionId || !sessionDate) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    console.log(`🔍 Searching for user ${userId}...`);

    // Find User
    const user = await Register.findById(userId);
    if (!user) {
      console.error("❌ User not found!");
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`🔍 Searching for Zoom Session with ID: ${sessionId}`);

    // Find Zoom Session by its _id
    const sessionIndex = user.zoomBookings.findIndex(
      (session) => session._id.toString() === sessionId
    );

    if (sessionIndex === -1) {
      console.error("❌ Session not found!");
      return res.status(404).json({ message: "Session not found" });
    }

    let session = user.zoomBookings[sessionIndex];

    console.log(`✅ Found session: ${session.eventName}`);

    // Format the provided sessionDate to ISO string (for comparison)
    const formattedSessionDate = new Date(sessionDate).toISOString();

    // Remove only the matching date object from sessionDates
    session.sessionDates = session.sessionDates.filter((dateObj) => {
      return new Date(dateObj.date).toISOString() !== formattedSessionDate;
    });

    console.log(`🔹 Remaining session dates after removal:`, session.sessionDates);

    // If no session dates remain, archive the session and remove it from zoomBookings
    if (session.sessionDates.length === 0) {
      console.log("✅ No more session dates left, moving session to archive...");

      const archivedSession = {
        name: session.eventName,
        description: "Zoom session was canceled by user",
        archivedAt: new Date(),
        sessionDate: formattedSessionDate,
        zoomMeetingLink: session.zoomMeetingLink || null,
        source: "zoom", // ✅ source is set to "zoom"
      };

      if (!user.archivedClasses) {
        user.archivedClasses = [];
      }

      console.log("🔍 Before Pushing: ", JSON.stringify(user.archivedClasses, null, 2));
      user.archivedClasses.push(archivedSession);
      console.log("🔍 After Pushing: ", JSON.stringify(user.archivedClasses, null, 2));

      user.zoomBookings.splice(sessionIndex, 1);

      // Force Mongoose to detect changes
      user.set("archivedClasses", [...user.archivedClasses]);
      user.markModified("archivedClasses");
      user.markModified("zoomBookings");
    } else {
      // Update the modified session in zoomBookings
      user.zoomBookings[sessionIndex] = session;
      user.markModified("zoomBookings");
    }

    console.log("🔍 Before Saving - archivedClasses:", JSON.stringify(user.archivedClasses, null, 2));

    await user.save();

    // Re-fetch archivedClasses for validation
    const updatedUser = await Register.findById(userId).select("archivedClasses");
    console.log("✅ Final Archived Classes in DB:", JSON.stringify(updatedUser.archivedClasses, null, 2));

    res.status(200).json({
      message: "Zoom session canceled and archived successfully",
      archivedClasses: updatedUser.archivedClasses,
    });
  } catch (error) {
    console.error("❌ Error canceling Zoom session:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

