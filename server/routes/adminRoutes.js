const express = require('express')
const {
  loginAdmin,
  getAdminStats, // This controller fetches initial stats
  getAnalytics,
  updateUser,
  deleteUser,
  cancelZoomSession,
  addOrUpdateZoomNote,
  addOrUpdateNoteToSession,
  deleteNoteFromSession,
  getAllBookedSessions,
  cancelSession,
  getAllUsers,
  getStripePayments,
  refundPayment,
  requestAdminPasswordReset,
  resetAdminPassword,
} = require('../controller/adminController')
const { protectAdmin } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/login', loginAdmin)
router.get('/stats', getAdminStats) // Used by frontend for initial data
router.get('/analytics', getAnalytics)
router.get('/users', getAllUsers)
router.put('/users/:id', updateUser)
router.get('/stripe-payments', getStripePayments)
router.post('/refund-payment', refundPayment)
router.delete('/users/:id', deleteUser)
router.post('/request-password-reset', requestAdminPasswordReset)
router.post('/add-note', addOrUpdateNoteToSession)
router.post('/reset-password/:token', resetAdminPassword)
router.get('/booked-sessions', getAllBookedSessions)
router.post('/cancel-session', cancelSession)
router.post('/add-zoom-note', addOrUpdateZoomNote)
router.post('/delete-note', deleteNoteFromSession)
router.post('/cancel-zoom-session', cancelZoomSession)

module.exports = router
