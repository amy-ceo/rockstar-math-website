const express = require("express");
const { updateUserProfile,updateUserPassword } = require("../controller/userController");

const router = express.Router();

// ✅ Update User Profile Route
router.put("/user/update/:userId", updateUserProfile);
router.put("/user/update-password/:userId", updateUserPassword);


module.exports = router;
