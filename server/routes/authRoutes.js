const express = require('express');
const { login,forgotPassword,resetPassword} = require('../controller/authController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;
