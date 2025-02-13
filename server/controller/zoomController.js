const axios = require("axios");
const dotenv = require("dotenv");
const User = require("../models/User"); // ✅ Import User Model
dotenv.config();

// ✅ Debugging: Print Zoom Credentials (Remove in production)
console.log("🔍 Zoom Credentials:", process.env.ZOOM_CLIENT_ID, process.env.ZOOM_CLIENT_SECRET, process.env.ZOOM_ACCOUNT_ID);

// ✅ Function to get a new Zoom Access Token
const getZoomAccessToken = async () => {
    try {
        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
            null, // No body needed
            {
                headers: {
                    Authorization: "Basic " + Buffer.from(
                        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
                    ).toString("base64"),
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
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!user.zoomMeeting) {
            return res.status(404).json({ error: "No Zoom meeting found" });
        }

        res.json({ meeting: user.zoomMeeting });
    } catch (error) {
        console.error("❌ Error fetching Zoom meeting:", error);
        res.status(500).json({ error: "Failed to fetch Zoom meeting" });
    }
};

// ✅ Function to Create a Zoom Meeting
const createMeetingForUser = async (userId, topic = "Math Class") => {
    try {
        // ✅ Fetch a new access token dynamically
        const accessToken = await getZoomAccessToken();

        // ✅ Create a Zoom Meeting
        const meetingResponse = await axios.post(
            "https://api.zoom.us/v2/users/me/meetings", // ✅ You can replace "me" with your Zoom account email
            {
                topic,
                type: 2,  // Scheduled Meeting
                start_time: new Date().toISOString(),
                duration: 60,  // 60 minutes
                timezone: "UTC",
                settings: {
                    host_video: true,
                    participant_video: true,
                    mute_upon_entry: true,
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
