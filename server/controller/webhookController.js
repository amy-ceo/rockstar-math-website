const Register = require("../models/registerModel");

exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📢 Calendly Webhook Received:', JSON.stringify(req.body, null, 2));

        const payload = req.body.payload;
        const inviteeEmail = payload.invitee.email;
        const eventName = payload.invitee.event;
        const eventUri = payload.invitee.uri;
        const startTime = payload.start_time;
        const endTime = payload.end_time;

        console.log('📅 Extracted Booking:', { inviteeEmail, eventName, eventUri, startTime, endTime });

        // ✅ Find User in Database
        const user = await Register.findOne({ billingEmail: inviteeEmail });
        if (!user) {
            console.error('❌ No user found with email:', inviteeEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        // ✅ Store Booking Data
        const newBooking = {
            eventType: eventName,
            calendlyUrl: eventUri,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        };

        console.log('📢 Saving to Database:', newBooking);

        await Register.findByIdAndUpdate(user._id, {
            $push: { calendlyBookings: newBooking }
        });

        console.log(`✅ Stored Calendly Booking for ${inviteeEmail}`);

        res.status(200).json({ message: 'Booking stored successfully' });
    } catch (error) {
        console.error('❌ Error handling Calendly webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getCalendlyBookings = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await Register.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({ bookings: user.calendlyBookings || [] });
    } catch (error) {
        console.error("❌ Error fetching bookings:", error);
        res.status(500).json({ message: "Server error" });
    }
};