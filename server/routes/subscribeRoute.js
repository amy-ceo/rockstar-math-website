const express = require("express");
const { subscribe } = require("../controller/subscribeController");

const router = express.Router();

// POST route to handle subscriptions
router.post("/subscribe", subscribe);

module.exports = router;
