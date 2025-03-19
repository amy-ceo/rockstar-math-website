
const crypto = require("crypto");
const Register = require("../models/registerModel");
const cron = require("node-cron");

const archiveExpiredZoomSessions = async () => {
  try {
    console.log("🔄 Running Zoom auto-archiving process...");

    const users = await Register.find();
    const currentDate = new Date();

    users.forEach(async (user) => {
      let updatedZoomBookings = [];
      let archivedSessions = [];

      user.zoomBookings.forEach((session) => {
        let futureSessions = session.sessionDates.filter(
          (date) => new Date(date) >= currentDate
        );

        let expiredSessions = session.sessionDates.filter(
          (date) => new Date(date) < currentDate
        );

        if (expiredSessions.length > 0) {
          expiredSessions.forEach((date) => {
            archivedSessions.push({
              name: session.eventName,
              description: "Session date has passed",
              archivedAt: new Date(),
              sessionDate: date, // Save expired session date
              zoomMeetingLink: session.zoomMeetingLink,
              source: "zoom", // ✅ Mark it as a Zoom session
            });
          });
        }

        if (futureSessions.length > 0) {
          session.sessionDates = futureSessions;
          updatedZoomBookings.push(session);
        }
      });

      user.zoomBookings = updatedZoomBookings;
      user.archivedClasses.push(...archivedSessions);
      await user.save();
    });

    console.log("✅ Auto-archiving of expired Zoom sessions completed!");
  } catch (error) {
    console.error("❌ Error auto-archiving Zoom sessions:", error);
  }
};

// ✅ Run the function daily at midnight
cron.schedule("0 0 * * *", archiveExpiredZoomSessions);


exports.zoomWebhook = async (req, res) => {
  try {
    console.log("📢 Headers:", req.headers);
    console.log("📢 Request IP:", req.headers["x-forwarded-for"] || req.connection.remoteAddress);
    console.log("📢 Full Payload:", JSON.stringify(req.body, null, 2));

    // ✅ Convert Buffer Body to JSON if necessary
    if (Buffer.isBuffer(req.body)) { 
      req.body = JSON.parse(req.body.toString("utf8"));
    }

    // ✅ 1️⃣ Handle Zoom URL Validation
    if (req.body.event === "endpoint.url_validation" && req.body.payload?.plainToken) {
      console.log("✅ Sending Validation Response:", req.body.payload.plainToken);

      // 🔹 Generate Encrypted Token for Validation
      let encryptedToken = crypto
        .createHmac("sha256", process.env.ZOOM_EVENT_VALIDATION_TOKEN)
        .update(req.body.payload.plainToken)
        .digest("hex");

      return res.status(200).json({
        plainToken: req.body.payload.plainToken,
        encryptedToken: encryptedToken,
      });
    }

    console.log("🔹 Received a Non-Validation Webhook Event:", req.body.event);

    // ✅ 2️⃣ Ensure Valid Webhook Payload
    if (!req.body.payload || !req.body.payload.object) {
      console.error("❌ Invalid Webhook Payload:", req.body);
      return res.status(400).json({ error: "Invalid Webhook Payload - Missing required fields" });
    }

    const payload = req.body.payload.object;
    const registrant = payload.registrant || {};
    const inviteeEmail = registrant.email || null;
    const meetingTopic = payload.topic || "Unknown Topic";
    const meetingId = payload.id || "Unknown ID";
    const joinUrl = registrant.join_url || "No Join URL Provided";

    const startTime = payload.start_time ? new Date(payload.start_time) : null;
    
    if (!inviteeEmail || !startTime) {
      console.error("❌ Missing required data:", { inviteeEmail, startTime });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ 3️⃣ Find User in MongoDB
    const user = await Register.findOne({ billingEmail: new RegExp(`^${inviteeEmail}$`, "i") }).exec();
    if (!user) {
      console.error("❌ No user found with email:", inviteeEmail);
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ 4️⃣ Generate Weekly Session Dates (Every 7 Days)
    const sessionDates = [];
    let currentDate = new Date(startTime);
    const today = new Date();

    while (currentDate >= today) {
      sessionDates.push(currentDate.toISOString()); // Store in ISO format
      currentDate.setDate(currentDate.getDate() - 7); // Move back by 7 days
    }

    sessionDates.reverse(); // Store dates in chronological order
    console.log("✅ Generated Session Dates:", sessionDates);

    // ✅ 5️⃣ Check if the Zoom Event Already Exists
    let existingMeeting = user.zoomBookings.find(booking => booking.zoomMeetingId === meetingId);

    if (existingMeeting) {
      if (!existingMeeting.sessionDates) {
        existingMeeting.sessionDates = []; // Ensure sessionDates array exists
      }

      // ✅ Add new session dates if they are not already present
      sessionDates.forEach(date => {
        if (!existingMeeting.sessionDates.some(storedDate => new Date(storedDate).getTime() === new Date(date).getTime())) {
          existingMeeting.sessionDates.push(date);
        }
      });

      user.markModified("zoomBookings");
      await user.save();
      console.log("✅ Updated existing Zoom booking with new session dates.");
    } else {
      // ✅ 6️⃣ Store New Zoom Booking
      const newZoomBooking = {
        eventName: meetingTopic,
        firstName: registrant.first_name || "N/A",
        lastName: registrant.last_name || "N/A",
        zoomMeetingId: meetingId,
        zoomMeetingLink: joinUrl,
        sessionDates: sessionDates.map(date => new Date(date).toISOString()), // ✅ Store as UTC ISO
        timezone: payload.timezone || "UTC", // ✅ Ensure timezone is stored
        status: "Booked",
      };
      
      user.zoomBookings.push(newZoomBooking);
      await user.save();
      console.log("✅ Successfully stored new Zoom booking.");
    }

    return res.status(200).json({ message: "Zoom Booking stored successfully", updatedUser: user });

  } catch (error) {
    console.error("❌ Error handling Zoom webhook:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getUserZoomBookings = async (req, res) => {
  try {
    const { userId } = req.params;  // ✅ Get userId from request parameters

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ✅ Find user by ID and fetch their zoomBookings only
    const user = await Register.findById(userId).select('zoomBookings').exec();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Ensure sessionDates is always returned as an array
    const zoomBookings = user.zoomBookings.map(booking => ({
      ...booking.toObject(),
      sessionDates: Array.isArray(booking.sessionDates) ? booking.sessionDates : [], // ✅ Ensure sessionDates is an array
    }));

    return res.status(200).json({
      message: 'Zoom bookings fetched successfully',
      zoomBookings,
    });

  } catch (error) {
    console.error('❌ Error fetching Zoom bookings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.cancelZoomSession = async (req, res) => {
  try {
    const { userId, sessionId, sessionDate } = req.body;

    if (!userId || !sessionId || !sessionDate) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // ✅ Find User
    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Find Zoom Session
    const sessionIndex = user.zoomBookings.findIndex(
      (session) => session._id.toString() === sessionId
    );
    if (sessionIndex === -1) {
      return res.status(404).json({ message: "Session not found" });
    }

    let session = user.zoomBookings[sessionIndex];

    // ✅ Remove the specific session date from sessionDates
    session.sessionDates = session.sessionDates.filter(
      (date) => date !== sessionDate
    );

    // ✅ If no more session dates left, move to archive
    if (session.sessionDates.length === 0) {
      user.archivedClasses.push({
        name: session.eventName,
        description: "Zoom session was canceled by user",
        archivedAt: new Date(),
        sessionDate: sessionDate, // ✅ Store canceled session date
        zoomMeetingLink: session.zoomMeetingLink,
        source: "zoom", // ✅ Identify this as a Zoom session
      });

      user.zoomBookings.splice(sessionIndex, 1); // ✅ Remove from zoomBookings
    } else {
      // ✅ Update the modified session back into zoomBookings
      user.zoomBookings[sessionIndex] = session;
    }

    // ✅ Save the updated user data
    await user.save();

    res.status(200).json({
      message: "Zoom session canceled and archived successfully",
      archivedClasses: user.archivedClasses,
    });
  } catch (error) {
    console.error("❌ Error canceling Zoom session:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



