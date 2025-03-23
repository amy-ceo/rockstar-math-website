// controllers/adminController.js
const Register = require('../models/registerModel');
const mongoose = require('mongoose');
const sendEmail = require('../utils/emailSender'); // or your own email sending method

// 1) GET ALL BOOKED SESSIONS (Calendly + Zoom)
exports.getAllBookedSessions = async (req, res) => {
  try {
    // We only need these fields from each user
    const users = await Register.find({}, 'bookedSessions zoomBookings username billingEmail');

    let allSessions = [];

    users.forEach((user) => {
      // A) Calendly sessions
      user.bookedSessions.forEach((session) => {
        allSessions.push({
          type: 'calendly',
          userId: user._id,
          userEmail: user.billingEmail,
          userName: user.username,
          sessionId: session._id,   // The _id of the bookedSession
          eventName: session.eventName,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          note: session.note || '',
        });
      });

      // B) Zoom sessions - each date is a separate row
      user.zoomBookings.forEach((zoomBooking) => {
        zoomBooking.sessionDates.forEach((dateObj) => {
          allSessions.push({
            type: 'zoom',
            userId: user._id,
            userEmail: user.billingEmail,
            userName: user.username,
            sessionId: zoomBooking._id, // The _id of the entire zoomBooking
            eventName: zoomBooking.eventName,
            startTime: dateObj.date,    // from the sub-document
            endTime: dateObj.date,      // or a separate end time if you store it
            status: dateObj.status || 'Booked',
            note: dateObj.note || '',
            zoomMeetingLink: zoomBooking.zoomMeetingLink || '',
          });
        });
      });
    });

    res.json({ success: true, sessions: allSessions });
  } catch (error) {
    console.error('Error fetching booked sessions:', error);
    res.status(500).json({ message: 'Failed to fetch booked sessions' });
  }
};

// 2) ADD OR UPDATE ZOOM NOTE
exports.addOrUpdateZoomNote = async (req, res) => {
  try {
    const { userId, sessionId, date, note } = req.body;

    if (!userId || !sessionId || !date) {
      return res.status(400).json({
        error: 'Missing required fields (userId, sessionId, date, note)',
      });
    }

    // Find user
    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the Zoom booking by _id
    const zoomBooking = user.zoomBookings.find(
      (booking) => booking._id.toString() === sessionId
    );
    if (!zoomBooking) {
      return res.status(404).json({ error: 'Zoom booking not found' });
    }

    // Find the date sub-document
    const dateObj = zoomBooking.sessionDates.find(
      (d) => new Date(d.date).toISOString() === new Date(date).toISOString()
    );
    if (!dateObj) {
      return res.status(404).json({ error: 'Date not found in sessionDates' });
    }

    // Update the note
    dateObj.note = note;

    // Save
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Note updated successfully!',
      updatedSessionDate: dateObj,
    });
  } catch (error) {
    console.error('Error updating Zoom session note:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 3) CANCEL ZOOM SESSION (Remove or archive the date)
exports.cancelZoomSession = async (req, res) => {
  try {
    const { userId, sessionId, sessionDate } = req.body;

    if (!userId || !sessionId || !sessionDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the correct zoomBooking
    const bookingIndex = user.zoomBookings.findIndex(
      (b) => b._id.toString() === sessionId
    );
    if (bookingIndex === -1) {
      return res.status(404).json({ error: 'Zoom booking not found' });
    }

    const booking = user.zoomBookings[bookingIndex];
    // If sessionDates is an array of sub-docs, find the date sub-doc
    const dateIndex = booking.sessionDates.findIndex(
      (d) => new Date(d.date).toISOString() === new Date(sessionDate).toISOString()
    );
    if (dateIndex === -1) {
      return res.status(404).json({ error: 'Session date not found' });
    }

    // Remove that date from the array
    booking.sessionDates.splice(dateIndex, 1);

    // If no dates remain, remove the entire booking or archive it
    if (booking.sessionDates.length === 0) {
      user.zoomBookings.splice(bookingIndex, 1);
    }

    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Zoom session cancelled successfully!' });
  } catch (error) {
    console.error('Error cancelling Zoom session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 4) CANCEL CALENDLY SESSION
exports.cancelSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.body;

    const updatedUser = await Register.findByIdAndUpdate(
      userId,
      { $pull: { bookedSessions: { _id: sessionId } } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // optionally send an email, etc.
    res.json({ success: true, message: 'Session cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ message: 'Failed to cancel session' });
  }
};

// 5) ADD OR UPDATE CALENDLY NOTE
exports.addOrUpdateNoteToSession = async (req, res) => {
  try {
    const { userId, startTime, note } = req.body;

    if (!userId || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await Register.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = user.bookedSessions.find(
      (s) => s.startTime.toISOString() === new Date(startTime).toISOString()
    );
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.note = note || '';

    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: 'Note updated successfully!', updatedSession: session });
  } catch (error) {
    console.error('Error adding/updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
