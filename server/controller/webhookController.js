const Register = require("../models/registerModel");


exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📢 Calendly Webhook Received:', JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.payload) {
            console.error('❌ Invalid Webhook Payload:', req.body);
            return res.status(400).json({ error: 'Invalid Webhook Payload' });
        }

        const payload = req.body.payload;
        const inviteeEmail = payload.invitee?.email || null;
        const eventName = payload.event?.name || "Unknown Event";
        const eventUri = payload.invitee?.uri || "No URL Provided";
        const startTime = payload.event?.start_time ? new Date(payload.event.start_time) : null;
        const endTime = payload.event?.end_time ? new Date(payload.event.end_time) : null;

        console.log('📅 Extracted Booking Details:', { inviteeEmail, eventName, eventUri, startTime, endTime });

        if (!inviteeEmail || !startTime || !endTime) {
            console.error('❌ Missing required data in webhook:', { inviteeEmail, startTime, endTime });
            return res.status(400).json({ error: 'Missing required fields in webhook data' });
        }

        const user = await Register.findOne({ billingEmail: inviteeEmail });

        if (!user) {
            console.error('❌ No user found with email:', inviteeEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('👤 User Found:', user);

        const newBooking = {
            eventType: eventName,
            calendlyUrl: eventUri,
            startTime: startTime,
            endTime: endTime
        };

        console.log('📢 Saving to Database:', newBooking);

        const updatedUser = await Register.findByIdAndUpdate(
            user._id,
            { $push: { calendlyBookings: newBooking } },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error('❌ Failed to update user bookings:', user._id);
            return res.status(500).json({ error: 'Failed to store booking' });
        }

        console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`);
        res.status(200).json({ message: 'Booking stored successfully', updatedUser });
    } catch (error) {
        console.error('❌ Error handling Calendly webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getCalendlyBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`📢 Fetching bookings for User ID: ${userId}`);

        const user = await Register.findById(userId);
        if (!user) {
            console.error("❌ User not found:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ User Found, Sending Bookings:", user.calendlyBookings || []);

        res.status(200).json({ bookings: user.calendlyBookings || [] });
    } catch (error) {
        console.error("❌ Error fetching bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};
