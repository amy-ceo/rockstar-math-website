const express = require('express');
const router = express.Router();
const Register = require('../models/registerModel'); // User Model
require('dotenv').config();

const zoomCourseMapping = [
  { name: '📘 Algebra 1 Tutoring', link: 'https://us06web.zoom.us/meeting/register/mZHoQiy9SqqHx69f4dejgg#/registration' },
  { name: '📗 Algebra 2 Tutoring', link: 'https://us06web.zoom.us/meeting/register/z2W2vvBHROGK_yEWMTeOrg#/registration' },
  { name: '📕 Calculus 1 Tutoring', link: 'https://us06web.zoom.us/meeting/register/kejThKqpTpetwaMNI33bAQ#/registration' },
  { name: '📙 Pre-Calculus & Trigonometry Tutoring', link: 'https://us06web.zoom.us/meeting/register/jH2N2rfMSXyqX1UDEZAarQ#/registration' },
  { name: '📒 Geometry Tutoring', link: 'https://us06web.zoom.us/meeting/register/Lsd_MFiwQpKRKhMZhPIYPw#/registration' },
];

const COMMONCORE_ZOOM_LINK = {
  name: 'Common Core- Parents',
  link: 'https://us06web.zoom.us/meeting/register/XsYhADVmQcK8BIT3Sfbpyg#/registration',
};

router.get('/proxy-zoom', async (req, res) => {
  try {
    const { userId, session } = req.query;

    if (!userId || !session) {
      return res.status(400).json({ error: 'Missing userId or session' });
    }

    // ✅ Check if the user exists & update zoomAccess in one step (Atomic)
    const user = await Register.findOneAndUpdate(
      { _id: userId, zoomAccess: { $ne: session } }, // ✅ Only update if session is NOT already in `zoomAccess`
      { $addToSet: { zoomAccess: session } }, // ✅ Atomic update: prevents race conditions
      { new: true } // ✅ Returns updated user
    );

    // ✅ If user is null, it means session was already accessed!
    if (!user) {
      return res.status(403).json({ error: 'You have already accessed this Zoom registration link!' });
    }

    // ✅ Find Zoom Link
    const foundCourse = zoomCourseMapping.find(course =>
      course.name.trim().toLowerCase() === session.trim().toLowerCase()
    );

    if (!foundCourse) {
      return res.status(404).json({ error: 'Invalid Zoom session name' });
    }

    console.log(`✅ User ${userId} accessed Zoom session: ${session}`);

    // ✅ Redirect to the Zoom Link
    return res.redirect(foundCourse.link);

  } catch (error) {
    console.error('❌ Error in Proxy Zoom:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
