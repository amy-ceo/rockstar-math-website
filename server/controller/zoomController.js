
const crypto = require("crypto");
const Register = require("../models/registerModel");

exports.zoomWebhook = async (req, res) => {
  try {
    console.log("📢 Received Zoom Webhook:", JSON.stringify(req.body, null, 2));

    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString("utf8"));
    }

    if (req.body.event === "endpoint.url_validation" && req.body.payload?.plainToken) {
      console.log("✅ Sending Validation Response:", req.body.payload.plainToken);
      const encryptedToken = crypto
        .createHmac("sha256", process.env.ZOOM_EVENT_VALIDATION_TOKEN)
        .update(req.body.payload.plainToken)
        .digest("hex");

      return res.status(200).json({
        plainToken: req.body.payload.plainToken,
        encryptedToken,
      });
    }

    if (!req.body.payload || !req.body.payload.object) {
      return res.status(400).json({ error: "Invalid Webhook Payload" });
    }

    const payload = req.body.payload.object;
    const registrant = payload.registrant || {};
    const inviteeEmail = registrant.email;
    const meetingTopic = payload.topic || "Unknown Topic";
    const meetingId = payload.id || "Unknown ID";
    const joinUrl = registrant.join_url || "No Join URL Provided";
    const startTime = payload.start_time
  ? new Date(payload.start_time).toISOString() // Ensure UTC format
  : null;


    if (!inviteeEmail || !startTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Find User
    const user = await Register.findOne({ billingEmail: new RegExp(`^${inviteeEmail}$`, "i") }).exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Find Existing Zoom Booking
    let existingMeeting = user.zoomBookings.find(booking => booking.zoomMeetingId === meetingId);

    if (existingMeeting) {
  if (!existingMeeting.sessionDates) {
    existingMeeting.sessionDates = []; // Ensure sessionDates array exists
  }

  // ✅ Ensure we're storing correct dates
  if (!existingMeeting.sessionDates.some(date => new Date(date).getTime() === new Date(startTime).getTime())) {
    existingMeeting.sessionDates.push(new Date(startTime)); // ✅ Store correct date
    user.markModified("zoomBookings");
    await user.save();
  }
}

    // ✅ Create New Zoom Booking
    const newZoomBooking = {
      eventName: meetingTopic,
      firstName: registrant.first_name || "N/A",
      lastName: registrant.last_name || "N/A",
      zoomMeetingId: meetingId,
      zoomMeetingLink: joinUrl,
      sessionDates: [startTime], // ✅ Store session dates as an array
      status: "Booked",
    };

    user.zoomBookings.push(newZoomBooking);
    await user.save();

    console.log("✅ Successfully Stored Zoom Booking");
    return res.status(200).json({ message: "Zoom Booking stored successfully", updatedUser: user });

  } catch (error) {
    console.error("❌ Error handling Zoom webhook:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserZoomBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await Register.findById(userId).select("zoomBookings").exec();
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.zoomBookings || !Array.isArray(user.zoomBookings)) {
      return res.status(200).json({ message: "No Zoom bookings found", zoomBookings: [] });
    }

    // ✅ Ensure sessionDates array is properly formatted
    const zoomBookings = user.zoomBookings.map((booking) => ({
      ...booking.toObject(),
      sessionDates: Array.isArray(booking.sessionDates) ? booking.sessionDates : [], // ✅ Ensure it is an array
    }));
    
    return res.status(200).json({ message: "Zoom bookings fetched successfully", zoomBookings });

  } catch (error) {
    console.error("❌ Error fetching Zoom bookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
