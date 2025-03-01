const Register = require("../models/registerModel");


exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2)); // ✅ Log full payload

        if (!req.body || !req.body.payload) {
            console.error('❌ Invalid Webhook Payload:', req.body);
            return res.status(400).json({ error: 'Invalid Webhook Payload' });
        }

        const payload = req.body.payload;
        console.log('🔍 Extracting Fields from Payload:', JSON.stringify(payload, null, 2));

        // ✅ Find the correct path of fields in received payload
        const inviteeEmail = payload?.invitee?.email || "❌ Missing";
        const eventName = payload?.event?.name || "❌ Missing";
        const eventUri = payload?.event?.uri || "❌ Missing";
        const startTime = payload?.event?.start_time ? new Date(payload.event.start_time) : "❌ Missing";
        const createdAt = payload?.created_at ? new Date(payload.created_at) : "❌ Missing";

        console.log('📅 Extracted Booking Details:', { inviteeEmail, eventName, eventUri, startTime, createdAt });

        if (inviteeEmail === "❌ Missing" || startTime === "❌ Missing") {
            console.error('❌ Missing required data in webhook:', { inviteeEmail, startTime });
            return res.status(400).json({ error: 'Missing required fields in webhook data' });
        }

        return res.status(200).json({ message: 'Webhook received successfully' });

    } catch (error) {
        console.error('❌ Error handling Calendly webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




exports.getCalendlyBookings = async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log("🔍 Checking UserId:", userId); // Debugging log
  
      // Find user in MongoDB
      const user = await Register.findById(userId);
      
      console.log("✅ Retrieved user data:", JSON.stringify(user, null, 2)); // Debugging log
  
      if (!user) {
        console.error("❌ User not found with ID:", userId);
        return res.status(404).json({ message: "User not found" });
      }
  
      // ✅ Return bookedSessions from the user
      res.status(200).json({ bookings: user.bookedSessions || [] });
  
    } catch (error) {
      console.error("❌ Error fetching bookings:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  