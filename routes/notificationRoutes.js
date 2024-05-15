const express = require('express')
const router = express.Router();
const NotificationController = require('../controllers/notificationController')

router.get('/api/notifications', NotificationController.getNotificationsByUserId);
router.get('/api/notifications/unread', NotificationController.getUnreadNotifications);
router.put('/api/read-notifications/:notificationId', NotificationController.readNotification);
router.delete('/api/delete-notification/:id', NotificationController.deleteNotificationbyId);


module.exports = router;