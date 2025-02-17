const express = require("express");
const router = express.Router();
const { requestWaitlist } = require("../controller/waitListController");

// ✅ POST route for requesting a free consultation
router.post("/waitlist", requestWaitlist);

module.exports = router;
