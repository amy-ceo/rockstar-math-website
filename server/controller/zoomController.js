  const Register = require("../models/registerModel");

  exports.zoomWebhook = async (req, res) => {
    try {
        console.log("📢 FULL Zoom Webhook Payload:", JSON.stringify(req.body, null, 2));

      
      // ✅ 1. Handle Empty Payload Case
      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("❌ Received an empty webhook payload!");
        return res.status(400).json({ error: "Invalid Webhook Payload - Empty request" });
      }

      // ✅ 2. Handle Zoom URL Validation Request (IMPORTANT!)
      if (req.body.event === "endpoint.url_validation") {
        console.log("✅ Zoom URL Validation Request Received!", req.body);

        if (req.body.payload && req.body.payload.plainToken) {
          console.log("✅ Sending Validation Response:", { plainToken: req.body.payload.plainToken });

          // 🔥 Fix: Ensure response is correctly formatted
          return res.status(200).json({ plainToken: req.body.payload.plainToken });
        }

        console.error("❌ Missing plainToken in Zoom validation request:", req.body);
        return res.status(400).json({ error: "Missing plainToken for validation" });
      }

      // ✅ 3. Validate Incoming Zoom Webhook Payload
      if (!req.body.payload || !req.body.payload.object) {
        console.error("❌ Invalid Webhook Payload:", req.body);
        return res.status(400).json({ error: "Invalid Webhook Payload - Missing required fields" });
      }

        const payload = req.body.payload.object;
        const registrant = payload.registrant || {};
        const inviteeEmail = registrant.email || "❌ Missing";
        const meetingTopic = payload.topic || "❌ Missing";
        const meetingId = payload.id || "❌ Missing";
        const joinUrl = registrant.join_url || "❌ Missing";

        const startTime = payload.start_time ? new Date(payload.start_time) : null;
        if (inviteeEmail === "❌ Missing" || !startTime) {
            console.error("❌ Missing required data:", { inviteeEmail, startTime });
            return res.status(400).json({ error: "Missing required fields" });
        }

        // ✅ Find user in MongoDB
        const user = await Register.findOne({ billingEmail: inviteeEmail }).exec();
        if (!user) {
            console.error("❌ No user found with email:", inviteeEmail);
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Check if Zoom Event Already Exists
        const eventAlreadyExists = user.zoomBookings.some(
            (booking) => booking.zoomMeetingId === meetingId
        );
        if (eventAlreadyExists) {
            console.log(`⚠️ Duplicate Zoom Event Detected: ${meetingTopic}. Skipping Booking.`);
            return res.status(200).json({ message: "Event already stored, skipping" });
        }

        // ✅ Store Zoom Booking Separately (No Session Deduction)
        const newZoomBooking = {
            eventName: meetingTopic,
            firstName: registrant.first_name || "N/A",
            lastName: registrant.last_name || "N/A",
            zoomMeetingId: meetingId,
            zoomMeetingLink: joinUrl,
            startTime,
            endTime: new Date(startTime.getTime() + (payload.duration || 30) * 60000),
            timezone: "UTC",
            status: "Booked",
        };

        user.zoomBookings.push(newZoomBooking);
        await user.save();

        console.log(`✅ Successfully Stored Zoom Booking for ${inviteeEmail}`);
        res.status(200).json({ message: "Zoom Booking stored successfully", updatedUser: user });

    } catch (error) {
        console.error("❌ Error handling Zoom webhook:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
  };

    

  exports.getUserZoomBookings = async (req, res) => {
    try {
      const { email } = req.query;

      // ✅ If an email is provided, filter by user
      if (email) {
        const user = await Register.findOne({ billingEmail: new RegExp(`^${email}$`, "i") }).exec();
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({
          message: "Zoom bookings fetched successfully",
          zoomBookings: user.zoomBookings || [],
        });
      }

      // ✅ If NO email is provided, fetch ALL users' Zoom bookings
      const allUsers = await Register.find({}, { zoomBookings: 1, _id: 0 }).exec();
      const allBookings = allUsers.flatMap((user) => user.zoomBookings || []);

      return res.status(200).json({
        message: "All Zoom bookings fetched successfully",
        zoomBookings: allBookings,
      });
    } catch (error) {
      console.error("❌ Error fetching Zoom bookings:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

    