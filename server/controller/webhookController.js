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

    // ✅ Extract Invitee & Event Details
    const inviteeEmail = payload?.email || '❌ Missing';
    const eventName = payload?.name || payload?.event?.name || '❌ Missing';
    const eventUri = payload?.event?.uri || payload?.event?.invitee?.uri || payload?.scheduled_event?.uri || '❌ Missing';

    // ✅ Move normalizeUrl ABOVE its first usage
    const normalizeUrl = (url) => url?.split('?')[0].trim().toLowerCase();

    const normalizedEventUri = eventUri !== '❌ Missing' ? normalizeUrl(eventUri) : null;

    // ✅ Extract `startTime` and `endTime`
    const startTime =
      payload?.start_time || payload?.event?.start_time || payload?.scheduled_event?.start_time
        ? new Date(
            payload?.start_time ||
              payload?.event?.start_time ||
              payload?.scheduled_event?.start_time
          )
        : null;

    const endTime =
      payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time
        ? new Date(
            payload?.end_time || payload?.event?.end_time || payload?.scheduled_event?.end_time
          )
        : startTime
        ? new Date(startTime.getTime() + 30 * 60000) // Default to 30 min duration
        : null;

    const timezone = payload?.timezone || payload?.event?.location?.timezone || '❌ Missing';

    // ✅ Validation: Ensure required fields are present
    if (inviteeEmail === '❌ Missing' || !startTime || !endTime) {
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

    if (!normalizedEventUri) {
      console.error('❌ Missing valid Calendly Event URI');
      return res.status(400).json({ error: 'Invalid or missing Calendly Event URL' });
    }

    // ✅ Find Matching Purchased Class
    let purchasedClass = user.purchasedClasses.find((cls) => {
      return normalizeUrl(cls.bookingLink) === normalizedEventUri;
    });

    // ✅ If no match, update the booking link and proceed with booking
    if (!purchasedClass) {
      console.warn(`⚠️ No valid purchased class found for user: ${inviteeEmail}`);

      if (user.purchasedClasses.length > 0) {
        user.purchasedClasses[0].bookingLink = normalizedEventUri;
        user.purchasedClasses[0].description = user.purchasedClasses[0].description || "Calendly Booking";
        user.markModified('purchasedClasses'); 
        await user.save();
        console.log(`🔄 Updated booking link to: ${normalizedEventUri}`);

        purchasedClass = user.purchasedClasses[0]; 
      } else {
        return res.status(400).json({ error: "No valid purchased class for this booking." });
      }
    }

    // ✅ Check if User Has Remaining Sessions
    if (purchasedClass.remainingSessions <= 0) {
      console.warn(`⚠️ User ${user.username} has no remaining sessions.`);
      return res.status(403).json({ error: "You have no remaining sessions left." });
    }

    // ✅ Deduct 1 Session
    purchasedClass.remainingSessions -= 1;
    user.markModified('purchasedClasses');

    if (purchasedClass.remainingSessions === 0) {
      purchasedClass.status = "Expired";
    }

    // ✅ Check if Event Already Exists in User's bookedSessions (Avoid Duplicates)
    const eventAlreadyExists = user.bookedSessions.some(
      (session) => session.calendlyEventUri === eventUri
    );

    if (eventAlreadyExists) {
      console.log(`⚠️ Event Already Exists in User Bookings: ${eventName}`);
      return res.status(200).json({ message: 'Event already stored, skipping' });
    }

    // ✅ Create New Booking Object
    const newBooking = {
      eventName,
      calendlyEventUri: eventUri,
      startTime,
      endTime,
      timezone,
      status: 'Booked',
      createdAt: new Date(),
    };

    console.log('📢 Storing New Booking:', JSON.stringify(newBooking, null, 2));

    // ✅ Update User's bookedSessions
    user.bookedSessions.push(newBooking);

    // ✅ Save User with the updated session and class data
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
