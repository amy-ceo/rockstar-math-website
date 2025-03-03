const express = require("express");
const { registerUser,addPurchasedClass,getPurchasedClasses,getUserCoupons,archiveClass,proxyCalendly,checkBookingLimit,cancelSession,getArchivedClasses,restoreClass,rescheduleBooking,getRemainingSession  } = require("../controller/registerController");
const { checkUserRegistration } = require("../controller/checkRegisterController");

const router = express.Router();

// ✅ User Registration Route
router.post("/register", registerUser);
router.post("/add-purchased-class", addPurchasedClass);
router.get("/:userId/purchased-classes", getPurchasedClasses);
router.get("/user-coupons/:userId", getUserCoupons);
router.get("/user/:userId/remaining-sessions", getRemainingSession);
router.post('/cancel-booking', cancelSession);
router.post('/reschedule-booking', rescheduleBooking);
router.post("/check-booking-limit", checkBookingLimit); // ✅ New Route to Check Before Booking
router.post("/proxy-calendly", proxyCalendly);

router.post("/check-registration", checkUserRegistration);
router.post('/archive-class', archiveClass); // ✅ Archive Class
router.get('/:userId/archived-classes', getArchivedClasses); // ✅ Fetch Archived Classes
router.post('/restore-class', restoreClass); // ✅ Restore Class

module.exports = router;
