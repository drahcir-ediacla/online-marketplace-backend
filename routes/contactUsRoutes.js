const express = require('express')
const router = express.Router()
const ContactUsController = require('../controllers/contactUsController');



router.post('/api/send-support-request', ContactUsController.sendSupporRequest);

module.exports = router;