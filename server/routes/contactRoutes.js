const express = require('express');
const router = express.Router();
const contactController = require('../controller/contactController');

// POST request to handle form submission
router.post('/submit', contactController.submitForm);

module.exports = router;
