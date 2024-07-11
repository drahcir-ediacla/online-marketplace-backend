const express = require('express')
const router = express.Router()
const MessagesController = require('../controllers/messagesController')
const isParticipant = require('../middleware/chatParticipants')

router.get('/api/check/chatid', MessagesController.checkChatId)
router.get('/api/get/chat/:chat_id/:sender_id', MessagesController.getChatId)
router.post('/api/create/chat', MessagesController.createChatMessages);
router.post('/api/send/messages', MessagesController.sendChatMessages);
router.post('/api/send-offer/messages', MessagesController.handleOfferOptions);
router.get('/api/get-all/user-chat', MessagesController.getAllUserChat)
router.get('/api/get-all/chats', MessagesController.getAllChat)
router.get('/api/get/messages/:chat_id', isParticipant, MessagesController.getMessages)
router.put('/api/read-message/:chat_id', MessagesController.readMessageByChatId);
router.put('/api/archive-message/:chat_id', MessagesController.archiveChat);
router.put('/api/delete-chat/:chat_id', MessagesController.deleteChatById);


module.exports = router;