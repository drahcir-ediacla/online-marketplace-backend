const express = require('express')
const router = express.Router();
const ForumNotificationController = require('../controllers/forumNotificationController')

router.get('/api/forum-notifications', ForumNotificationController.getForumNotificationsByUserId);


module.exports = router;