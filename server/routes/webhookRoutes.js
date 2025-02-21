const express = require("express");
const router = express.Router();
const Register = require("../models/registerModel");

// ✅ Calendly Webhook Route
router.post("/calendly", async (req, res) => {
  try {
    const { event, payload } = req.body;

    // ✅ Ensure this is an invitee created event
    if (event !== "invitee.created") {
      return res.status(400).json({ success: false, message: "Invalid event type" });
    }

    console.log("✅ New Calendly Booking Received:", payload);

    // ✅ Extract user email from Calendly data
    const userEmail = payload.email;
    const user = await Register.findOne({ billingEmail: userEmail });

    if (!user) {
      console.log("❌ User not found for Calendly booking:", userEmail);
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // ✅ Create new booking object
    const newBooking = {
      eventId: payload.event.uri, // Unique Event ID
      userEmail,
      eventType: payload.event_type.name, // e.g., "90 minute session"
      startTime: new Date(payload.start_time),
      endTime: new Date(payload.end_time),
    };

    // ✅ Add new booking to user's `calendlyBookings` array
    user.calendlyBookings.push(newBooking);
    await user.save();

    console.log("✅ Calendly Booking Saved Successfully!");
    return res.status(200).json({ success: true, message: "Booking stored in database" });

  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
