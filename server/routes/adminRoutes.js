const express = require("express");
const { loginAdmin, getAdminStats,getAnalytics ,updateUser,deleteUser,getAllUsers,getStripePayments,refundPayment,requestAdminPasswordReset, resetAdminPassword} = require("../controller/adminController");
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


module.exports = router;
