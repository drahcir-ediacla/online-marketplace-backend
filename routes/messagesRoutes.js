const express = require('express')
const router = express.Router()
const MessagesController = require('../controllers/messagesController')
const isParticipant = require('../middleware/chatParticipants')

router.get('/api/check/chatid', MessagesController.checkChatId)
router.get('/api/get/chat/:chat_id', MessagesController.getChatId)
router.post('/api/send/messages', MessagesController.createChatMessages);
router.get('/api/get/messages/:chat_id', isParticipant, MessagesController.getMessages)


module.exports = router;