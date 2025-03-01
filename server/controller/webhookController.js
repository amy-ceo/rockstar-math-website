const Register = require('../models/registerModel')

exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.payload) {
            console.error('❌ Invalid Webhook Payload:', req.body);
            return res.status(400).json({ error: 'Invalid Webhook Payload' });
        }

        const payload = req.body.payload;

        // ✅ Extract necessary fields
        const inviteeEmail = payload?.invitee?.email || "❌ Missing";
        const eventName = payload?.event?.name || "❌ Missing";
        const eventUri = payload?.event?.uri || "❌ Missing";
        const startTime = payload?.event?.start_time ? new Date(payload.event.start_time) : null;
        const endTime = payload?.event?.end_time ? new Date(payload.event.end_time) : null;
        const duration = payload?.event?.duration || 90;
        const timezone = payload?.event?.location?.timezone || "❌ Missing";

        // ✅ Extract phone numbers correctly
        const phoneNumbers = Array.isArray(payload?.event?.location?.numbers)
            ? payload.event.location.numbers.map(num => ({
                country: num.country || num.country_name || "Unknown Country",
                number: num.number || "Unknown Number",
                type: num.type || "Unknown Type"
            }))
            : [];

        // ✅ Extract country
        const country = payload?.event?.location?.country || (phoneNumbers.length > 0 ? phoneNumbers[0].country : "❌ Missing");

        console.log('📅 Extracted Booking Details:', { inviteeEmail, eventName, eventUri, startTime, endTime, duration, timezone, country, phoneNumbers });

        // ✅ Validation
        if (!inviteeEmail || !startTime || !endTime) {
            console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // ✅ Find user
        const user = await Register.findOne({ billingEmail: inviteeEmail });

        if (!user) {
            console.error('❌ No user found:', inviteeEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('👤 User Found:', user);

        // ✅ Store booking
        const newBooking = {
            eventName,
            calendlyEventUri: eventUri,
            startTime,
            endTime,
            duration,
            timezone,
            country,
            phoneNumbers,
            status: "Booked",
            createdAt: new Date(),
        };

        console.log('📢 Storing New Booking:', newBooking);

        // ✅ Update MongoDB
        const updatedUser = await Register.findByIdAndUpdate(
            user._id,
            { $push: { bookedSessions: newBooking } },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.error('❌ Failed to update user bookings:', user._id);
            return res.status(500).json({ error: 'Failed to store booking' });
        }

        console.log(`✅ Successfully Stored Booking for ${inviteeEmail}`);
        res.status(200).json({ message: 'Booking stored successfully', updatedUser });

    } catch (error) {
        console.error('❌ Error handling webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.getCalendlyBookings = async (req, res) => {
  try {
    const { userId } = req.params

    console.log('🔍 Checking UserId:', userId) // Debugging log

    // Find user in MongoDB
    const user = await Register.findById(userId)

    console.log('✅ Retrieved user data:', JSON.stringify(user, null, 2)) // Debugging log

    if (!user) {
      console.error('❌ User not found with ID:', userId)
      return res.status(404).json({ message: 'User not found' })
    }

    // ✅ Return bookedSessions from the user
    res.status(200).json({ bookings: user.bookedSessions || [] })
  } catch (error) {
    console.error('❌ Error fetching bookings:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
