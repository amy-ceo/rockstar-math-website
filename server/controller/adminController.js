const Admin = require('../models/Admin')
const Register = require('../models/registerModel') // User Model
const StripePayment = require('../models/StripePayment') // Your Payment Model in DB
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) // Stripe API for refunds
const sendEmail = require('../utils/emailSender')
const crypto = require('crypto')
const mongoose = require('mongoose')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

// --- loginAdmin ---
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body
  try {
    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }
    if (!admin.password.startsWith('$2b$')) {
      // Or your bcrypt prefix
      const salt = await bcrypt.genSalt(10)
      admin.password = await bcrypt.hash(admin.password, salt)
      await admin.save()
    }
    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }
    const token = generateToken(admin._id)
    res.status(200).json({
      message: 'Admin Login Successful',
      token,
      admin: { _id: admin._id, name: admin.name, email: admin.email },
    })
  } catch (error) {
    console.error('Admin Login Error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// --- getAnalytics ---
// This can still fetch from Stripe for broad analytics if desired,
// or you can adapt it to use your StripePayment collection for more tailored analytics.
// For consistency with payments page, using StripePayment might be better long-term.
// The current implementation fetches live from Stripe.
exports.getAnalytics = async (req, res) => {
  try {
    const paymentIntentsFromStripe = await stripe.paymentIntents.list({
      limit: 100,
      expand: ['data.latest_charge'],
    })

    let totalRevenue = 0
    let paymentMethods = {}
    let revenueTrends = {}
    let courseSales = {} // This relies on metadata.courseName which might not always be on PaymentIntent

    paymentIntentsFromStripe.data.forEach((pi) => {
      if (pi.status === 'succeeded') {
        const amountForRevenue = pi.amount_received || pi.amount // amount_received if available, else amount
        totalRevenue += amountForRevenue / 100

        const date = new Date(pi.created * 1000).toISOString().split('T')[0]
        revenueTrends[date] = (revenueTrends[date] || 0) + amountForRevenue / 100

        const method = pi.payment_method_types[0] || 'unknown'
        paymentMethods[method] = (paymentMethods[method] || 0) + 1

        // For courseSales, it's better if your StripePayment model stores this info consistently
        if (pi.metadata && pi.metadata.cartSummary) {
          // Using cartSummary as an example
          const items = pi.metadata.cartSummary.split(', ')
          items.forEach((item) => {
            courseSales[item.trim()] = (courseSales[item.trim()] || 0) + 1
          })
        } else if (pi.latest_charge && pi.latest_charge.description) {
          // Fallback to charge description if metadata is not there
          courseSales[pi.latest_charge.description] =
            (courseSales[pi.latest_charge.description] || 0) + 1
        }
      }
    })

    const formattedRevenueTrends = Object.keys(revenueTrends).map((date) => ({
      date,
      amount: revenueTrends[date],
    }))

    const totalUsers = await Register.countDocuments()
    const userSignupsData = await Register.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    const formattedUserSignups = userSignupsData.map((entry) => ({
      date: entry._id,
      count: entry.count,
    }))

    res.json({
      totalRevenue,
      totalUsers,
      courseSales: Object.entries(courseSales).map(([course, sales]) => ({ course, sales })),
      paymentMethods: Object.entries(paymentMethods).map(([method, count]) => ({ method, count })),
      revenueTrends: formattedRevenueTrends,
      userSignups: formattedUserSignups,
    })
  } catch (error) {
    console.error('❌ Error fetching analytics:', error)
    res.status(500).json({ message: 'Error fetching analytics', error: error.message })
  }
}

// --- getAdminStats ---
// This is used for the main admin dashboard summary cards and is ALREADY using your DB.
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await Register.countDocuments()
    // Fetches from your StripePayment collection
    const paymentsFromDB = await StripePayment.find({}) // Fetch all to correctly calculate based on status

    const totalRevenue = paymentsFromDB
      .filter((p) => p.status === 'Completed' || p.status === 'succeeded') // Consider only succeeded for revenue
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)

    const totalCoursesSold = paymentsFromDB
      .filter((p) => p.status === 'Completed' || p.status === 'succeeded') // Count sales from succeeded payments
      .reduce((sum, payment) => {
        return (
          sum +
          (payment.cartItems && Array.isArray(payment.cartItems) ? payment.cartItems.length : 0)
        )
      }, 0)

    res.json({
      totalUsers,
      totalRevenue,
      totalCoursesSold,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    res.status(500).json({ message: 'Error fetching stats', error: error.message })
  }
}

// --- getAllUsers ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await Register.find({}).select('-password') // Exclude passwords
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users.' })
  }
}

// --- updateUser ---
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, phone } = req.body // Ensure 'email' from body is mapped to 'billingEmail'
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user ID format.' })
    }
    const updatedUser = await Register.findByIdAndUpdate(
      id,
      { username, billingEmail: email, phone }, // Map `email` to `billingEmail`
      { new: true, runValidators: true },
    ).select('-password')
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' })
    }
    res.json({ success: true, message: 'User updated successfully.', user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user.' })
  }
}

// --- deleteUser ---
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid user ID format.' })
    }
    const deletedUser = await Register.findByIdAndDelete(id)
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' })
    }
    // Optionally: Clean up related data, e.g., payments associated with this user if necessary (soft delete or anonymize)
    res.json({ success: true, message: 'User deleted successfully.' })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user.' })
  }
}

// --- getStripePayments (MODIFIED TO FETCH FROM YOUR DATABASE) ---
exports.getStripePayments = async (req, res) => {
  try {
    // Fetch payments from your StripePayment collection in MongoDB
    // Sort by creation date, newest first
    // Populate userId to get user details like username or email if needed for display/search
    const paymentsFromDB = await StripePayment.find({})
      .sort({ createdAt: -1 }) // Sort by DB timestamp
      .populate('userId', 'username billingEmail') // Populate user details

    // The frontend expects data in a certain structure.
    // Map your DB data to match what Stripe's API `paymentIntents.list` might return,
    // OR adjust your frontend to match your DB structure.
    // It's generally better to send what your DB stores.
    // The frontend table uses: id, metadata.customer_name, amount_received/100, status, payment_method_types[0], created
    // Your StripePayment model has: paymentIntentId, userId, billingEmail, amount, currency, status, paymentMethod, cartItems, createdAt

    const formattedPayments = paymentsFromDB.map((p) => ({
      id: p.paymentIntentId, // Use paymentIntentId as the primary ID
      paymentIntentId: p.paymentIntentId, // Keep for clarity if needed
      userId: p.userId
        ? { _id: p.userId._id, username: p.userId.username, billingEmail: p.userId.billingEmail }
        : null, // Populated user
      billingEmail: p.billingEmail || (p.userId ? p.userId.billingEmail : null), // Email for display
      amount: p.amount, // Amount is already in dollars (or your base currency unit) as saved
      currency: p.currency,
      status: p.status, // e.g., "Completed", "refunded"
      paymentMethod: p.paymentMethod, // e.g., "Stripe", "card" (ensure consistency)
      cartItems: p.cartItems,
      createdAt: p.createdAt, // DB timestamp
      refundId: p.refundId, // If you store refund ID
      // Fields for compatibility with previous frontend structure (if strictly needed)
      // amount_received: p.amount * 100, // If frontend expects cents for this field
      // payment_method_types: [p.paymentMethod || 'card'], // If frontend expects an array
      // created: Math.floor(new Date(p.createdAt).getTime() / 1000) // If frontend expects Unix timestamp
    }))

    res.json(formattedPayments)
  } catch (error) {
    console.error('Error fetching payments from DB:', error)
    res.status(500).json({ message: 'Error fetching payments from database', error: error.message })
  }
}

// --- refundPayment (MODIFIED as per previous response for DB update and Socket emission) ---
exports.refundPayment = async (req, res) => {
  const { paymentId } = req.body // This is the Stripe Payment Intent ID (e.g., pi_xxxx)

  if (!paymentId) {
    return res.status(400).json({ message: 'Payment Intent ID is required.' })
  }

  try {
    const paymentInDb = await StripePayment.findOne({ paymentIntentId: paymentId })
    if (!paymentInDb) {
      return res.status(404).json({ message: 'Payment not found in our records.' })
    }
    if (paymentInDb.status === 'refunded') {
      return res.status(400).json({ message: 'This payment has already been refunded.' })
    }
    if (paymentInDb.status !== 'Completed' && paymentInDb.status !== 'succeeded') {
      return res
        .status(400)
        .json({ message: `Payment status is ${paymentInDb.status}, cannot refund.` })
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
    })

    const updatedPayment = await StripePayment.findOneAndUpdate(
      { paymentIntentId: paymentId },
      { status: 'refunded', refundId: refund.id, lastModified: new Date() }, // Store Stripe refund ID
      { new: true },
    ).populate('userId', 'username billingEmail')

    if (!updatedPayment) {
      // This case means the DB update failed after Stripe refund succeeded. Critical to log.
      console.error(
        `CRITICAL: Stripe refund ${refund.id} for PI ${paymentId} succeeded, but DB update failed.`,
      )
      // Potentially try to update again or flag for manual intervention.
      // For now, inform admin but acknowledge Stripe success.
      return res
        .status(500)
        .json({ message: 'Stripe refund succeeded but DB update failed. Please check logs.' })
    }

    console.log(
      `✅ Payment ${paymentId} refunded successfully. Stripe Refund ID: ${refund.id}. DB status updated.`,
    )

    const io = req.io
    if (io) {
      const formattedUpdatedPayment = {
        // Format consistently with getStripePayments
        id: updatedPayment.paymentIntentId,
        paymentIntentId: updatedPayment.paymentIntentId,
        userId: updatedPayment.userId
          ? {
              _id: updatedPayment.userId._id,
              username: updatedPayment.userId.username,
              billingEmail: updatedPayment.userId.billingEmail,
            }
          : null,
        billingEmail:
          updatedPayment.billingEmail ||
          (updatedPayment.userId ? updatedPayment.userId.billingEmail : null),
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        status: updatedPayment.status,
        paymentMethod: updatedPayment.paymentMethod,
        cartItems: updatedPayment.cartItems,
        createdAt: updatedPayment.createdAt,
        refundId: updatedPayment.refundId,
      }
      io.emit('paymentUpdated', formattedUpdatedPayment)

      // Recalculate and emit summary stats
      const allPayments = await StripePayment.find({})
      const totalRevenue = allPayments
        .filter((p) => p.status === 'Completed' || p.status === 'succeeded') // Only 'succeeded' for revenue
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalTransactions = allPayments.length
      const problemTransactions = allPayments.filter(
        (p) => ['failed', 'requires_payment_method', 'canceled'].includes(p.status), // Consider what 'failed' means for you
      ).length

      io.emit('paymentSummaryUpdated', {
        totalRevenue,
        totalTransactions,
        failedTransactions: problemTransactions, // Match frontend state name if different
      })
      console.log('📊 Emitted paymentUpdated and paymentSummaryUpdated event after refund.')
    }

    res.status(200).json({ message: 'Refund processed successfully.', data: updatedPayment })
  } catch (error) {
    console.error('Error processing refund:', error)
    let errorMessage = 'Failed to process refund.'
    if (error.type === 'StripeInvalidRequestError' && error.code === 'charge_already_refunded') {
      errorMessage = 'This payment has already been fully refunded by Stripe.'
      // Ensure DB is also marked as refunded
      await StripePayment.findOneAndUpdate(
        { paymentIntentId: paymentId, status: { $ne: 'refunded' } },
        { status: 'refunded', lastModified: new Date() }, // Add refundId if you can retrieve it
        { new: true },
      )
      // Emit update if DB was changed
      const io = req.io
      if (io) io.emit('paymentUpdated', { paymentIntentId: paymentId, status: 'refunded' })
    } else if (error.type) {
      // Stripe specific error
      errorMessage = error.message
    }
    res.status(500).json({ message: errorMessage, errorInfo: error.message })
  }
}

// --- requestAdminPasswordReset ---
exports.requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body
    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(400).json({ message: 'Admin with this email does not exist' })
    }
    const resetToken = crypto.randomBytes(32).toString('hex')
    const salt = await bcrypt.genSalt(10)
    admin.resetPasswordToken = await bcrypt.hash(resetToken, salt)
    admin.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await admin.save()
    const resetURL = `https://www.rockstarmath.com/admin/reset-password/${resetToken}` // Frontend URL
    await sendEmail(
      admin.email,
      'RockstarMath Admin Password Reset',
      `Click here to reset your password: ${resetURL}`,
    )
    res.json({ message: 'Password reset link sent to email' })
  } catch (error) {
    console.error('Password Reset Request Error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// --- resetAdminPassword ---
exports.resetAdminPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { newPassword } = req.body
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' })
    }
    const admin = await Admin.findOne({
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!admin || !admin.resetPasswordToken) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired token (admin not found or token missing)' })
    }
    const isTokenValid = await bcrypt.compare(token, admin.resetPasswordToken)
    if (!isTokenValid) {
      return res.status(400).json({ message: 'Invalid or expired token (token mismatch)' })
    }
    const salt = await bcrypt.genSalt(10)
    admin.password = await bcrypt.hash(newPassword, salt)
    admin.resetPasswordToken = undefined
    admin.resetPasswordExpires = undefined
    await admin.save()
    res.status(200).json({ message: 'Password reset successful!' })
  } catch (error) {
    console.error('Password Reset Error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// --- getAllBookedSessions ---
exports.getAllBookedSessions = async (req, res) => {
  try {
    const users = await Register.find({}, 'bookedSessions zoomBookings username billingEmail')
      .populate('bookedSessions') // If bookedSessions are refs
      .populate('zoomBookings') // If zoomBookings are refs
    let allSessions = []
    users.forEach((user) => {
      ;(user.bookedSessions || []).forEach((session) => {
        allSessions.push({
          type: 'calendly',
          userId: user._id,
          userEmail: user.billingEmail,
          userName: user.username,
          sessionId: session._id,
          eventName: session.eventName,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          note: session.note || '',
        })
      })
      ;(user.zoomBookings || []).forEach((zoomBooking) => {
        ;(zoomBooking.sessionDates || []).forEach((dateObj) => {
          allSessions.push({
            type: 'zoom',
            userId: user._id,
            userEmail: user.billingEmail,
            userName: user.username,
            sessionId: zoomBooking._id, // Parent booking _id
            sessionDateId: dateObj._id, // ID of the specific date entry
            eventName: zoomBooking.eventName,
            startTime: dateObj.date,
            endTime: dateObj.date, // Adjust if endTime is different
            status: dateObj.status || 'Booked',
            note: dateObj.note || '',
            zoomMeetingLink: zoomBooking.zoomMeetingLink || '',
          })
        })
      })
    })
    allSessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)) // Sort newest first
    res.json({ success: true, sessions: allSessions })
  } catch (error) {
    console.error('Error fetching booked sessions:', error)
    res.status(500).json({ message: 'Failed to fetch booked sessions', error: error.message })
  }
}

// --- cancelZoomSession ---
exports.cancelZoomSession = async (req, res) => {
  try {
    const { userId, sessionId, sessionDateId } = req.body // Use sessionDateId
    if (!userId || !sessionId || !sessionDateId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const zoomBooking = user.zoomBookings.id(sessionId) // Find subdocument by ID
    if (!zoomBooking) return res.status(404).json({ error: 'Zoom booking not found' })

    const dateIndex = zoomBooking.sessionDates.findIndex((d) => d._id.toString() === sessionDateId)
    if (dateIndex === -1) return res.status(404).json({ error: 'Specific session date not found' })

    zoomBooking.sessionDates.splice(dateIndex, 1)
    if (zoomBooking.sessionDates.length === 0) {
      zoomBooking.remove() // Mongoose subdocument remove
    }
    await user.save({ validateBeforeSave: false })
    res.json({ success: true, message: 'Zoom session date cancelled successfully!' })
  } catch (error) {
    console.error('Error cancelling Zoom session date:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

// --- addOrUpdateZoomNote ---
exports.addOrUpdateZoomNote = async (req, res) => {
  try {
    const { userId, sessionId, sessionDateId, note } = req.body // Use sessionDateId
    if (!userId || !sessionId || !sessionDateId || note === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const zoomBooking = user.zoomBookings.id(sessionId)
    if (!zoomBooking) return res.status(404).json({ error: 'Zoom booking not found' })

    const dateObj = zoomBooking.sessionDates.id(sessionDateId) // Find specific date entry by its _id
    if (!dateObj) return res.status(404).json({ error: 'Session date not found in this booking' })

    dateObj.note = note
    await user.save({ validateBeforeSave: false })
    res.json({
      success: true,
      message: 'Zoom note updated successfully!',
      updatedSessionDate: dateObj,
    })
  } catch (error) {
    console.error('Error updating Zoom session note:', error)
    res.status(500).json({ error: 'Internal Server Error', details: error.message })
  }
}

// --- cancelSession (for Calendly/bookedSessions) ---
exports.cancelSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body // sessionId is the _id of the bookedSession
    if (!userId || !sessionId) {
      return res.status(400).json({ message: 'User ID and Session ID are required.' })
    }
    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const session = user.bookedSessions.id(sessionId) // Mongoose method to find subdocument by _id
    if (!session) return res.status(404).json({ message: 'Session not found for this user.' })

    session.remove() // Mongoose method to remove subdocument
    await user.save({ validateBeforeSave: false })

    // Optionally send email
    // const emailSubject = 'Your Scheduled Session Has Been Cancelled';
    // const emailMessage = `Dear ${user.username || 'User'},\n\nYour session scheduled for ${new Date(session.startTime).toLocaleString()} has been cancelled by the admin. If you have any concerns, please contact support.\n\nBest regards,\nRockstarMath Team`;
    // await sendEmail(user.billingEmail, emailSubject, emailMessage);

    res.json({ success: true, message: 'Calendly session cancelled successfully.' })
  } catch (error) {
    console.error('Error cancelling Calendly session:', error)
    res.status(500).json({ message: 'Failed to cancel session', error: error.message })
  }
}

// --- deleteNoteFromSession (for Calendly/bookedSessions) ---
exports.deleteNoteFromSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body // sessionId is the _id of the bookedSession
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'User ID and Session ID are required.' })
    }
    if (!isValidObjectId(userId) || !isValidObjectId(sessionId)) {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const session = user.bookedSessions.id(sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found' })

    session.note = '' // Clear the note
    await user.save({ validateBeforeSave: false })
    res.json({ success: true, message: 'Note deleted successfully!', updatedSession: session })
  } catch (error) {
    console.error('Error deleting note from Calendly session:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

// --- addOrUpdateNoteToSession (for Calendly/bookedSessions) ---
exports.addOrUpdateNoteToSession = async (req, res) => {
  try {
    const { userId, sessionId, note } = req.body // sessionId is the _id of the bookedSession
    if (!userId || !sessionId || note === undefined) {
      return res.status(400).json({ error: 'User ID, Session ID and note are required.' })
    }
    if (!isValidObjectId(userId) || !isValidObjectId(sessionId)) {
      return res.status(400).json({ error: 'Invalid ID format.' })
    }
    const user = await Register.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const session = user.bookedSessions.id(sessionId)
    if (!session) return res.status(404).json({ error: 'Session not found' })

    session.note = note
    await user.save({ validateBeforeSave: false })
    res.json({ success: true, message: 'Note updated successfully!', updatedSession: session })
  } catch (error) {
    console.error('Error adding/updating note to Calendly session:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
