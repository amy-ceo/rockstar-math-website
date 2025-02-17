const express = require("express");
const router = express.Router();
const { requestConsultation } = require("../controller/consultationController");

// ✅ POST route for requesting a free consultation
router.post("/request", requestConsultation);

module.exports = router;
