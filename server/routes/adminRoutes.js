const express = require("express");
const { loginAdmin, getAdminStats,getAnalytics ,updateUser,deleteUser,addNoteToSession,getAllBookedSessions,cancelSession,getAllUsers,getStripePayments,refundPayment,requestAdminPasswordReset, resetAdminPassword} = require("../controller/adminController");
const { protectAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", loginAdmin);
// router.get("/profile", protectAdmin, getAdminProfile);
router.get("/stats", getAdminStats);
router.get("/analytics", getAnalytics);
// ✅ Add this route to get all users
router.get("/users", getAllUsers);  
// ✅ Update user
router.put('/users/:id', updateUser);
router.get('/stripe-payments', getStripePayments);
router.post('/refund-payment', refundPayment);
// ✅ Delete user
router.delete('/users/:id', deleteUser);
// ✅ Route to Request Password Reset (Admin)
router.post("/request-password-reset", requestAdminPasswordReset);

// ✅ Route to Reset Password (Admin)
router.post("/reset-password/:token", resetAdminPassword);
router.get("/booked-sessions", getAllBookedSessions);
router.post("/cancel-session", cancelSession);
// ✅ Route for adding note to a booked session
router.post("/add-note", addNoteToSession);


module.exports = router;
