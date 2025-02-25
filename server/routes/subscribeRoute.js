const express = require("express");
const router = express.Router();
const { subscribe, getSubscribers, deleteSubscriber, updateSubscriber } = require("../controller/subscribeController");

router.post("/subscribe", subscribe);  // Existing subscription route
router.get("/subscribers", getSubscribers); // Fetch all subscribers
router.delete("/subscribers/:id", deleteSubscriber); // Delete a subscriber
router.put("/subscribers/:id", updateSubscriber); // Update a subscriber's email

module.exports = router;
