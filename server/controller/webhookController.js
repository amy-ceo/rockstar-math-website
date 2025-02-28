const Register = require("../models/registerModel");

exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📡 Webhook Received:', req.body); // Debugging

        const { event, payload } = req.body;

        if (!event || !payload || !payload.invitee) {
            return res.status(400).json({ message: 'Invalid webhook payload' });
        }

        const { email, event: sessionName, uri, start_time, end_time } = payload.invitee;

        // ✅ Find User by Email
        const user = await Register.findOne({ billingEmail: email });

        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ Store Booking in User's Purchased Classes
        const newBooking = {
            name: sessionName,
            description: `Booked through Calendly`,
            purchaseDate: new Date(),
            bookingLink: uri,
            sessionCount: 1,
            remainingSessions: 0,
        };

        user.purchasedClasses.push(newBooking);
        await user.save();

        console.log('✅ Booking stored successfully for user:', email);
        return res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return res.status(500).json({ message: 'Server error' });
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