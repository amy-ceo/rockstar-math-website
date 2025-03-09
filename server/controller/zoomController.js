const Register = require('../models/registerModel')

exports.zoomWebhook = async (req, res) => {
  try {
      console.log("📢 FULL Zoom Webhook Payload:", req.body);

      // ✅ If request body is a Buffer, convert it to a JSON object
      if (Buffer.isBuffer(req.body)) {
          req.body = JSON.parse(req.body.toString("utf8"));
      }

      // ✅ 1. Handle Zoom URL Validation Request (VERY IMPORTANT)
      if (req.body.event === "endpoint.url_validation" && req.body.payload?.plainToken) {
          console.log("✅ Sending Immediate Validation Response:", req.body.payload.plainToken);

          // 🚀 Ensure correct response type
          res.setHeader("Content-Type", "text/plain");
          return res.status(200).send(req.body.payload.plainToken);
      }

      console.log("🔹 Received a Non-Validation Webhook Event:", req.body.event);

      // ✅ 2. Ensure Incoming Zoom Webhook Payload is Valid
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

      // ✅ 3. Check if User Exists in MongoDB
      const user = await Register.findOne({ billingEmail: new RegExp(`^${inviteeEmail}$`, "i") }).exec();
      if (!user) {
          console.error("❌ No user found with email:", inviteeEmail);
          return res.status(404).json({ error: "User not found" });
      }

      // ✅ 4. Check for Duplicate Zoom Event
      const eventAlreadyExists = user.zoomBookings.some(booking => booking.zoomMeetingId === meetingId);
      if (eventAlreadyExists) {
          console.log(`⚠️ Duplicate Zoom Event Detected: ${meetingTopic}. Skipping Booking.`);
          return res.status(200).json({ message: "Event already stored, skipping" });
      }

      // ✅ 5. Store Zoom Booking in User Document
      const newZoomBooking = {
          eventName: meetingTopic,
          firstName: registrant.first_name || "N/A",
          lastName: registrant.last_name || "N/A",
          zoomMeetingId: meetingId,
          zoomMeetingLink: joinUrl,
          startTime,
          endTime: new Date(startTime.getTime() + ((payload.duration || 30) * 60000)),
          timezone: "UTC",
          status: "Booked",
      };

      user.zoomBookings.push(newZoomBooking);
      await user.save();

      console.log(`✅ Successfully Stored Zoom Booking for ${inviteeEmail}`);
      return res.status(200).json({ message: "Zoom Booking stored successfully", updatedUser: user });

  } catch (error) {
      console.error("❌ Error handling Zoom webhook:", error);
      return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getUserZoomBookings = async (req, res) => {
  try {
    const { email } = req.query

    // ✅ If an email is provided, filter by user
    if (email) {
      const user = await Register.findOne({ billingEmail: new RegExp(`^${email}$`, 'i') }).exec()
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      return res.status(200).json({
        message: 'Zoom bookings fetched successfully',
        zoomBookings: user.zoomBookings || [],
      })
    }

    // ✅ If NO email is provided, fetch ALL users' Zoom bookings
    const allUsers = await Register.find({}, { zoomBookings: 1, _id: 0 }).exec()
    const allBookings = allUsers.flatMap((user) => user.zoomBookings || [])

    return res.status(200).json({
      message: 'All Zoom bookings fetched successfully',
      zoomBookings: allBookings,
    })
  } catch (error) {
    console.error('❌ Error fetching Zoom bookings:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
