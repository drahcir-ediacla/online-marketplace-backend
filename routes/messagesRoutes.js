const express = require('express')
const router = express.Router()
const MessagesController = require('../controllers/messagesController')

router.post('/api/messages', MessagesController.createMessages);
router.get('/api/messages/:sender/:receiver', MessagesController.getMessages)


module.exports = router;