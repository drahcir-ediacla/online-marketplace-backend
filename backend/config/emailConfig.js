const nodemailer = require('nodemailer');

// Send OTP via email
const transPorter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = transPorter;
