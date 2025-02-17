const express = require("express");
const User = require("../models/User");
const { addPurchasedClass, getPurchasedClasses } = require("../controller/authController");
const router = express.Router();

router.get("/check-user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ billingEmail: req.params.email });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Save Purchased Class
router.post("/purchase", addPurchasedClass);
// ✅ Get User's Purchased Classes
router.get("/:userId/purchased-classes", getPurchasedClasses);

module.exports = router;
