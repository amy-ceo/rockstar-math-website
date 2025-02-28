const Register = require("../models/registerModel");


exports.calendlyWebhook = async (req, res) => {
    try {
        console.log("📢 [LIVE] Calendly Webhook Received:", JSON.stringify(req.body, null, 2));

        const { payload } = req.body;
        if (!payload || !payload.event || !payload.invitee) {
            console.error("❌ [LIVE] Invalid webhook data received");
            return res.status(400).json({ error: "Invalid webhook data" });
        }

        console.log("✅ [LIVE] Webhook Payload Extracted:", payload);

        const inviteeEmail = payload.invitee.email;
        const eventName = payload.event.name;
        const eventUri = payload.event.uri;
        const startTime = new Date(payload.event.start_time);
        const endTime = new Date(payload.event.end_time);

        console.log("📅 [LIVE] Extracted Booking Details:", { inviteeEmail, eventName, eventUri, startTime, endTime });

        // Check if the user exists in the database
        const user = await Register.findOne({ billingEmail: inviteeEmail });
        if (!user) {
            console.error("❌ [LIVE] No user found with email:", inviteeEmail);
            return res.status(404).json({ error: "User not found" });
        }

        console.log("👤 [LIVE] User Found:", user);

        const newBooking = {
            eventType: eventName,
            calendlyUrl: eventUri,
            startTime: startTime,
            endTime: endTime,
        };

        console.log("📢 [LIVE] Saving to Database:", newBooking);

        // Store booking details in database
        const updatedUser = await Register.findByIdAndUpdate(
            user._id,
            { $push: { calendlyBookings: newBooking } },
            { new: true, runValidators: true }
        );

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
        const user = await Register.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ bookings: user.calendlyBookings || [] });
    } catch (error) {
        console.error("❌ Error fetching bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};
