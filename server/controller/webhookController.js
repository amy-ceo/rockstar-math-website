const Register = require('../models/registerModel')

exports.calendlyWebhook = async (req, res) => {
    try {
        console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.payload) {
            console.error('❌ Invalid Webhook Payload:', req.body);
            return res.status(400).json({ error: 'Invalid Webhook Payload' });
        }

        const payload = req.body.payload;

        // ✅ Extract Invitee & Event Details
        const inviteeEmail = payload?.email || "❌ Missing";
        const eventName = payload?.name || payload?.event?.name || "❌ Missing";
        const eventUri = payload?.uri || payload?.event?.uri || "❌ Missing";

        // ✅ Fix: Extract `startTime` from multiple possible locations
        const startTime = payload?.start_time 
            || payload?.event?.start_time 
            || payload?.scheduled_event?.start_time
            ? new Date(payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time) 
            : null;

        const endTime = payload?.end_time 
            || payload?.event?.end_time 
            || payload?.scheduled_event?.end_time
            ? new Date(payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time) 
            : startTime ? new Date(startTime.getTime() + 30 * 60000) // Default to 30 min duration
            : null;

        const timezone = payload?.timezone || payload?.event?.location?.timezone || "❌ Missing";

        // ✅ Extract Host Information
        const hostEmail = payload?.event_memberships?.[0]?.user_email || "❌ Missing";
        const hostName = payload?.event_memberships?.[0]?.user_name || "❌ Missing";
        const hostCalendlyUrl = payload?.event_memberships?.[0]?.user || "❌ Missing";

        // ✅ Extract Invitee Counter
        const activeInvitees = payload?.invitees_counter?.active || 0;
        const inviteeLimit = payload?.invitees_counter?.limit || 0;
        const totalInvitees = payload?.invitees_counter?.total || 0;

        // ✅ Extract Meeting Details (Zoom, Phone Numbers, etc.)
        const joinUrl = payload?.location?.join_url || "No Zoom Link";
        const intlNumbersUrl = payload?.location?.extra?.intl_numbers_url || null;

        // ✅ Extract Dial-In Numbers
        const dialInNumbers = payload?.location?.data?.settings?.global_dial_in_numbers?.map(number => ({
            countryName: number.country_name || "Unknown",
            city: number.city || null,
            number: number.number,
            type: number.type || "unknown"
        })) || [];

        console.log('📅 Extracted Booking Details:', { 
            inviteeEmail, eventName, eventUri, startTime, endTime, timezone, 
            hostEmail, hostName, hostCalendlyUrl, activeInvitees, inviteeLimit, totalInvitees, 
            joinUrl, intlNumbersUrl, dialInNumbers
        });

        // ✅ Validation: Ensure required fields are present
        if (inviteeEmail === "❌ Missing" || !startTime || !endTime) {
            console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // ✅ Find user in MongoDB using invitee email
        const user = await Register.findOne({ billingEmail: inviteeEmail });

        if (!user) {
            console.error('❌ No user found:', inviteeEmail);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('👤 User Found:', user);

        // ✅ Check if Event Already Exists in User's bookedSessions (Avoid Duplicates)
        const eventAlreadyExists = user.bookedSessions.some(session => session.calendlyEventUri === eventUri);

        if (eventAlreadyExists) {
            console.log(`⚠️ Event Already Exists in User Bookings: ${eventName}`);
            return res.status(200).json({ message: 'Event already stored, skipping' });
        }

        // ✅ Create New Booking Object (Following User's `bookedSessions` Schema)
        const newBooking = {
            eventName,
            calendlyEventUri: eventUri,
            startTime,
            endTime,
            timezone,
            activeInvitees,
            inviteeLimit,
            totalInvitees,
            joinUrl,
            dialInNumbers,
            status: "Booked",
            createdAt: new Date()
        };

        console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2));

        // ✅ Update User's bookedSessions
        user.bookedSessions.push(newBooking);

        await user.save();
        console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`);

        res.status(200).json({ message: 'Booking stored successfully', updatedUser: user });

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
