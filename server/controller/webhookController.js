const Register = require('../models/registerModel')
const sendEmail = require('../utils/emailSender')

exports.calendlyWebhook = async (req, res) => {
  try {
    console.log('📢 FULL Webhook Payload:', JSON.stringify(req.body, null, 2));

    if (!req.body || !req.body.payload) {
      console.error('❌ Invalid Webhook Payload:', req.body);
      return res.status(400).json({ error: 'Invalid Webhook Payload' });
    }

    const payload = req.body.payload;

    // ✅ Extract Invitee & Event Details Correctly
    const inviteeEmail =
      (payload?.invitees && payload?.invitees.length > 0 && payload?.invitees[0]?.email) 
        ? payload?.invitees[0]?.email 
        : '❌ Missing';

    const eventName = payload?.name || payload?.event?.name || '❌ Missing';
    const eventUri = payload?.uri || payload?.event?.uri || '❌ Missing';

    // ✅ Extract Start Time and End Time Correctly
    const startTimeRaw = payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time;
    const endTimeRaw = payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time;

    // Convert to date only if values exist
    const startTime = startTimeRaw ? new Date(startTimeRaw) : null;
    const endTime = endTimeRaw ? new Date(endTimeRaw) : startTime ? new Date(startTime.getTime() + 30 * 60000) : null;

    const timezone = payload?.timezone || payload?.event?.location?.timezone || '❌ Missing';

    // ✅ Validate Required Fields
    if (inviteeEmail === '❌ Missing' || !startTime || !endTime) {
      console.error('❌ Missing required data:', { inviteeEmail, startTime, endTime });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ✅ Find User in MongoDB
    const user = await Register.findOne({ billingEmail: inviteeEmail });

    if (!user) {
      console.error('❌ No user found:', inviteeEmail);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('👤 User Found:', user);

    // ✅ Normalize URLs for comparison
    const normalizeUrl = (url) => {
      return url ? url.split('?')[0].trim().replace(/[;]+$/, '').toLowerCase() : null;
    };

    const normalizedEventUri = normalizeUrl(eventUri);
    console.log('🔍 Normalized Event URI:', normalizedEventUri);

    let purchasedClass = user.purchasedClasses.find((cls) => normalizeUrl(cls.bookingLink) === normalizedEventUri);

    if (!purchasedClass) {
      console.warn(`⚠️ No valid purchased class found for user: ${inviteeEmail}`);
      return res.status(400).json({ error: 'No valid purchased class for this booking.' });
    }

    // ✅ Deduct 1 Session
    if (purchasedClass.remainingSessions > 0) {
      purchasedClass.remainingSessions -= 1;
    } else {
      return res.status(403).json({ error: 'No sessions left to deduct from. Please purchase more.' });
    }

    user.markModified('purchasedClasses');

    if (purchasedClass.remainingSessions === 0) {
      purchasedClass.status = 'Expired';
    }

    const newBooking = {
      eventName,
      calendlyEventUri: eventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    };

    user.bookedSessions.push(newBooking);
    user.markModified('bookedSessions');

    await user.save();
    console.log(`✅ Successfully Stored Calendly Booking for ${inviteeEmail}`);
    console.log(`✅ Session Booked: Remaining ${purchasedClass.remainingSessions} sessions.`);

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
