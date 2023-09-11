const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "488507af2ac87e",
    pass: "6c8c0107ea2d69",
  },
});

module.exports = transporter;
