const express = require("express");
const { calendlyWebhook } = require("../controller/webhookController");
const router = express.Router();

router.post("/calendly", calendlyWebhook);

module.exports = router;
