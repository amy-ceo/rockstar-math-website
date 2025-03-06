const express = require("express");
const { updateUserProfile, updateUserPassword, getUserProfile } = require("../controller/userController");

const router = express.Router();

// ✅ Fetch User Profile Route (Newly Added)
router.get("/user/:userId", getUserProfile); 

// ✅ Update User Profile
router.put("/user/update/:userId", updateUserProfile);

// ✅ Update Password
router.put("/user/update-password/:userId", updateUserPassword);

module.exports = router;
