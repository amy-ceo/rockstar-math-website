const express = require("express");
const router = express.Router();
const { createMeetingForUser, getUserZoomMeeting } = require("../controller/zoomController");

// ✅ Route to Get User's Zoom Meeting
router.get('/users/:userId/zoom-meeting', getUserZoomMeeting);
router.post("/users/:userId/create-meeting", createMeetingForUser);
module.exports = router;
