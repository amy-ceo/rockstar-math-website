const Register = require('../models/registerModel')

exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.payload) {
            console.error('❌ Invalid Webhook Payload:', req.body);
            return res.status(400).json({ error: 'Invalid Webhook Payload' });
        }

        const payload = req.body.payload;

        // ✅ Extract details from payload
        const inviteeEmail = payload?.email || "❌ Missing";
        const eventName = payload?.name || "❌ Missing";
        const eventUri = payload?.uri || "❌ Missing";
        const startTime = payload?.start_time ? new Date(payload.start_time) : null;
        const endTime = payload?.end_time ? new Date(payload.end_time) : new Date(startTime.getTime() + 30 * 60000); // Default: 30 min
        const timezone = payload?.timezone || "❌ Missing";
        const country = payload?.location?.country || "❌ Missing";
        const duration = 30; // Fixed Duration

        // ✅ Extract Phone Numbers
        const phoneNumbers = payload?.location?.location_phones?.map(num => ({
            country: num.country || "Unknown Country",
            number: num.number || "Unknown Number",
            type: num.type || "Unknown Type"
        })) || [];

        console.log('📅 Extracted Booking Details:', { inviteeEmail, eventName, eventUri, startTime, endTime, timezone, country, phoneNumbers });

        // ✅ Validation
        if (inviteeEmail === "❌ Missing" || !startTime || !endTime) {
            console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // ✅ Find user in MongoDB using email
        const user = await Register.findOne({ billingEmail: inviteeEmail });

        if (!user) {
            console.error('❌ No user found:', inviteeEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('👤 User Found:', user);

        // ✅ Store booking in MongoDB
        const newBooking = {
            eventName,
            calendlyEventUri: eventUri,
            startTime,
            endTime,
            timezone,
            country,
            phoneNumbers,
            status: "Booked",
            createdAt: new Date(),
        };

        console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2));

        // ✅ Update user in MongoDB
        const updatedUser = await Register.findByIdAndUpdate(
            user._id,
            { $push: { bookedSessions: newBooking } },
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
