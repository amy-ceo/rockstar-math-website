    const axios = require("axios");
    const dotenv = require("dotenv");
    const User = require("../models/User"); // ✅ Import User Model
    dotenv.config();

    // ✅ Validate Zoom Credentials Before Execution
    if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET || !process.env.ZOOM_ACCOUNT_ID) {
        console.error("❌ Missing Zoom environment variables. Please check .env file.");
        throw new Error("Missing Zoom environment variables.");
    }

    // ✅ Function to get a new Zoom Access Token
    const getZoomAccessToken = async () => {
        try {
            const credentials = Buffer.from(
                `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
            ).toString("base64");

            const response = await axios.post(
                "https://zoom.us/oauth/token",
                null, // No body needed
                {
                    params: { grant_type: "account_credentials", account_id: process.env.ZOOM_ACCOUNT_ID },
                    headers: {
                        Authorization: `Basic ${credentials}`,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            console.log("✅ Zoom Access Token Fetched Successfully!");
            return response.data.access_token;
        } catch (error) {
            console.error("❌ Error getting Zoom access token:", error.response?.data || error.message);
            throw new Error("Failed to get Zoom access token");
        }
    };


    // ✅ Function to Fetch User's Zoom Meeting
    const getUserZoomMeeting = async (req, res) => {
        try {
            const user = await User.findById(req.params.userId);
            if (!user) return res.status(404).json({ success: false, error: "User not found" });

            if (!user.zoomMeeting) {
                return res.status(404).json({ success: false, error: "No Zoom meeting found" });
            }

            res.json({ success: true, meeting: user.zoomMeeting });
        } catch (error) {
            console.error("❌ Error fetching Zoom meeting:", error);
            res.status(500).json({ success: false, error: "Failed to fetch Zoom meeting" });
        }
    };

    // ✅ Function to Create a Zoom Meeting
    const createMeetingForUser = async (userId, topic = "Math Class") => {
        try {
            // ✅ Fetch a new access token dynamically
            const accessToken = await getZoomAccessToken();

            // ✅ Get User from DB
            const user = await User.findById(userId);
            if (!user) {
                throw new Error("User not found in database.");
            }

            // ✅ Zoom Email/ID (Replace "me" with actual user email if needed)
            const zoomUserId = "me"; // Change this if necessary (e.g., `user.zoomEmail`)

            // ✅ Create a Zoom Meeting
            const meetingResponse = await axios.post(
                `https://api.zoom.us/v2/users/${zoomUserId}/meetings`,
                {
                    topic,
                    type: 2,  // Scheduled Meeting
                    start_time: new Date(Date.now() + 15 * 60000).toISOString(), // ✅ Start in 15 minutes
                    duration: 60,  // 60 minutes
                    timezone: "UTC",
                    settings: {
                        host_video: true,
                        participant_video: true,
                        mute_upon_entry: true,
                        approval_type: 0, // No approval needed
                        registration_type: 1, // Attendees need to register
                        waiting_room: true, // Enable waiting room
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("✅ Zoom Meeting Created Successfully!", meetingResponse.data.join_url);

            // ✅ Save meeting link in user's data
            await User.findByIdAndUpdate(userId, { zoomMeeting: meetingResponse.data.join_url });

            return meetingResponse.data.join_url;  // ✅ Return Zoom Meeting Link
        } catch (error) {
            console.error("❌ Error creating Zoom meeting:", error.response?.data || error.message);
            throw new Error("Failed to create Zoom meeting");
        }
    };

    module.exports = { createMeetingForUser, getUserZoomMeeting };
