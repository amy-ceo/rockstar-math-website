
const crypto = require("crypto");
const Register = require("../models/registerModel");

exports.zoomWebhook = async (req, res) => {
  try {
    console.log("📢 Headers:", req.headers);
    console.log("📢 Request IP:", req.headers["x-forwarded-for"] || req.connection.remoteAddress);
    console.log("📢 Full Payload:", JSON.stringify(req.body, null, 2));

    // ✅ Convert Buffer to JSON (if necessary)
    if (Buffer.isBuffer(req.body)) {
      req.body = JSON.parse(req.body.toString("utf8"));
    }

    // ✅ 1️⃣ Handle Zoom URL Validation (Required for Webhook Setup)
    if (req.body.event === "endpoint.url_validation" && req.body.payload?.plainToken) {
      console.log("✅ Sending Validation Response:", req.body.payload.plainToken);

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
    const duration = payload.duration || 30; // Default 30 minutes

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

    // ✅ 4️⃣ Check if Meeting Already Exists
    let existingMeeting = user.zoomBookings.find(booking => booking.zoomMeetingId === meetingId);

    if (existingMeeting) {
      console.log(`⚠️ Existing Zoom Meeting Found. Adding Additional Date: ${startTime}`);

      // ✅ Append new session date if it doesn't already exist
      if (!existingMeeting.sessionDates.some(date => date.getTime() === startTime.getTime())) {
        existingMeeting.sessionDates.push(startTime);
        await user.save();
        console.log("✅ Added new session date to existing Zoom booking.");
      } else {
        console.log("⚠️ Session date already exists. Skipping update.");
      }
      return res.status(200).json({ message: "Updated existing Zoom booking with a new session date." });
    }

    // ✅ 5️⃣ Create New Zoom Booking with Multiple Dates
    const newZoomBooking = {
      eventName: meetingTopic,
      firstName: registrant.first_name || "N/A",
      lastName: registrant.last_name || "N/A",
      zoomMeetingId: meetingId,
      zoomMeetingLink: joinUrl,
      sessionDates: [startTime], // ✅ Store session dates in an array
      duration,
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
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // ✅ Find user and fetch zoomBookings
    const user = await Register.findById(userId).select("zoomBookings").exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Ensure zoomBookings is always an array
    if (!user.zoomBookings || !Array.isArray(user.zoomBookings)) {
      console.warn(`⚠️ No zoomBookings found for user ${userId}. Returning empty array.`);
      return res.status(200).json({
        message: "No Zoom bookings found",
        zoomBookings: [], // ✅ Return an empty array if zoomBookings is missing
      });
    }

    // ✅ Format session dates properly
    const zoomBookings = user.zoomBookings.map((booking) => ({
      ...booking.toObject(),
      sessionDates: booking.sessionDates
        ? booking.sessionDates.map(date => new Date(date).toLocaleString())
        : [], // ✅ Ensure sessionDates is always an array
    }));

    return res.status(200).json({
      message: "Zoom bookings fetched successfully",
      zoomBookings,
    });
  } catch (error) {
    console.error("❌ Error fetching Zoom bookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

