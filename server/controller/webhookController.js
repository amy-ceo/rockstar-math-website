const Register = require("../models/registerModel");


exports.calendlyWebhook = async (req, res) => {
    try {
        console.log("📢 [LIVE] Calendly Webhook Received:", JSON.stringify(req.body, null, 2));

        const { payload } = req.body;
        if (!payload || !payload.event || !payload.invitee) {
            console.error("❌ [LIVE] Invalid webhook data received");
            return res.status(400).json({ error: "Invalid webhook data" });
        }

        const inviteeEmail = payload.invitee.email;
        const eventName = payload.event.name;
        const eventUri = payload.event.uri;
        const startTime = new Date(payload.event.start_time);
        const endTime = new Date(payload.event.end_time);

        console.log("📅 [LIVE] Extracted Booking Details:", { inviteeEmail, eventName, eventUri, startTime, endTime });

        // Fetch user from DB
        const user = await Register.findOne({ billingEmail: inviteeEmail });

        if (!user) {
            console.error("❌ [LIVE] No user found with email:", inviteeEmail);
            return res.status(404).json({ error: "User not found" });
        }

        console.log("👤 [LIVE] User Found:", user);

        // Construct the booking object
        const newBooking = {
            eventName: eventName,
            calendlyEventUri: eventUri,
            startTime: startTime,
            endTime: endTime,
            status: "Booked",
            createdAt: new Date(),
        };

        console.log("📢 [LIVE] Saving to Database:", newBooking);

        // Store booking in database
        const updatedUser = await Register.findByIdAndUpdate(
            user._id,
            { $push: { bookedSessions: newBooking } },
            { new: true, runValidators: true }
        );

        console.log("✅ [LIVE] Updated User Response:", updatedUser);

        if (!updatedUser) {
            console.error("❌ [LIVE] Failed to update user bookings:", user._id);
            return res.status(500).json({ error: "Failed to store booking" });
        }

        console.log(`✅ [LIVE] Successfully Stored Calendly Booking for ${inviteeEmail}`);
        res.status(200).json({ message: "Booking stored successfully", updatedUser });

    } catch (error) {
        console.error("❌ [LIVE] Error handling Calendly webhook:", error);
        res.status(500).json({ error: "Internal Server Error" });
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
  