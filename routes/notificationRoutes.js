const express = require('express')
const router = express.Router();
const NotificationController = require('../controllers/notificationController')

router.get('/api/notifications', NotificationController.getNotificationsByUserId);
router.put('/api/read-notifications/:notificationId', NotificationController.readNotification)


module.exports = router;