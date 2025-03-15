const express = require("express");
const router = express.Router();
const { webhookHandler } = require("../controller/webhookHandler");

// ✅ Unified Webhook Route (Handles both Calendly & Zoom)
router.post("/", webhookHandler);

module.exports = router;
