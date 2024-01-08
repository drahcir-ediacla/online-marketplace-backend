const express = require('express')
const router = express.Router()
const MessagesController = require('../controllers/messagesController')

router.post('/api/send/messages', MessagesController.createMessages);
router.get('/api/get/messages', MessagesController.getMessages)


module.exports = router;