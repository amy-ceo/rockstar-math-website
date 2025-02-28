const Register = require("../models/registerModel");

exports.calendlyWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    console.log("📩 Calendly Webhook Received:", event);
    console.log("🔹 Payload Data:", payload);

    if (event === "invitee.created") {
      const { invitee } = payload;

      // ✅ Find User by Email
      const user = await Register.findOne({ billingEmail: invitee.email });

      if (!user) {
        console.warn("⚠️ User not found for email:", invitee.email);
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Check if Session Already Exists
      const existingSession = user.bookedSessions.find(
        (session) => session.calendlyEventUri === invitee.uri
      );

      if (existingSession) {
        console.log("⚠️ Session already exists for:", invitee.email);
        return res.status(400).json({ message: "Session already exists" });
      }

      // ✅ Save the Booked Session
      user.bookedSessions.push({
        eventName: invitee.event,
        calendlyEventUri: invitee.uri,
        startTime: invitee.start_time,
        endTime: invitee.end_time,
        status: "Booked",
      });

      await user.save();
      console.log("✅ Session saved successfully for:", user.email);
    }

    res.status(200).json({ message: "Webhook received successfully!" });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ message: "Server error" });
  }
};
