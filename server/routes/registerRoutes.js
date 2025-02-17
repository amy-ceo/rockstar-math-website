const express = require("express");
const { registerUser,addPurchasedClass,getPurchasedClasses } = require("../controller/registerController");
const { checkUserRegistration } = require("../controller/checkRegisterController");

const router = express.Router();

// ✅ User Registration Route
router.post("/register", registerUser);
router.post("/add-purchased-class", addPurchasedClass);
router.get("/:userId/purchased-classes", getPurchasedClasses);
// ✅ Check if User is Already Registered
router.post("/check-registration", checkUserRegistration);


module.exports = router;
