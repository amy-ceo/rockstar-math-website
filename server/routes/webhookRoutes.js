const express = require("express");
const router = express.Router();
const Register = require("../models/registerModel");

// ✅ Calendly Webhook Route
router.post("/calendly", async (req, res) => {
  try {
    const { event, payload } = req.body;

    // ✅ Ensure the payload is valid
    if (!event || !payload) {
      console.error("❌ Invalid Webhook Payload:", req.body);
      return res.status(400).json({ success: false, message: "Invalid webhook payload" });
    }

    // ✅ Ensure this is an invitee created event
    if (event !== "invitee.created") {
      console.warn("⚠️ Ignoring non-invitee event:", event);
      return res.status(200).json({ success: true, message: "Event ignored" });
    }

    console.log("✅ New Calendly Booking Received:", payload);

    // ✅ Extract user email & validate structure
    const userEmail = payload?.email || payload?.invitee?.email;
    const eventType = payload?.event_type?.name || "Unknown Event";
    const startTime = payload?.start_time || null;
    const endTime = payload?.end_time || null;
    const eventId = payload?.event?.uri || null;

    if (!userEmail || !startTime || !endTime || !eventId) {
      console.error("❌ Missing required fields in webhook payload:", payload);
      return res.status(400).json({ success: false, message: "Incomplete webhook data" });
    }

    // ✅ Find the user in the database
    const user = await Register.findOne({ billingEmail: userEmail });

    if (!user) {
      console.warn("❌ No user found for this email:", userEmail);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Create new booking object
    const newBooking = {
      eventId,
      userEmail,
      eventType,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
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

router.get("/:userId/calendly-bookings", async (req, res) => {
  try {
    const user = await Register.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.status(200).json({ bookings: user.calendlyBookings || [] });
  } catch (error) {
    console.error("❌ Error fetching Calendly bookings:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
