const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ✅ Generate Zoom JWT Token
const generateZoomJWT = () => {
  const payload = {
    iss: process.env.ZOOM_CLIENT_ID,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token valid for 1 hour
  };

  return jwt.sign(payload, process.env.ZOOM_CLIENT_SECRET);
};

// ✅ Create a Zoom Meeting
const createZoomMeeting = async (topic, duration, startTime) => {
  const token = generateZoomJWT();

  const meetingData = {
    topic: topic || "Scheduled Meeting",
    type: 2, // 2 = Scheduled Meeting
    duration: duration || 60, // Duration in minutes
    start_time: startTime || new Date().toISOString(), // Start time in ISO format
    timezone: "America/New_York",
    agenda: "Rockstar Math Session",
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: false,
      mute_upon_entry: true,
      approval_type: 0, // Automatically approve participants
      waiting_room: false,
    },
  };

  try {
    const response = await axios.post("https://api.zoom.us/v2/users/me/meetings", meetingData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data; // Return Zoom Meeting details
  } catch (error) {
    console.error("❌ Error Creating Zoom Meeting:", error.response?.data || error.message);
    throw new Error("Failed to create Zoom meeting.");
  }
};

module.exports = { createZoomMeeting };
