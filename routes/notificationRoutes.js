const express = require('express')
const router = express.Router();
const NotificationController = require('../controllers/notificationController')

router.get('/api/notifications', NotificationController.getNotificationsById);


module.exports = router;