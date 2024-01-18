const express = require('express')
const router = express.Router()
const { uploadChatImageMiddleware, uploadChatImage } = require('../controllers/imagesController')

router.post('/api/upload-chat-image', uploadChatImageMiddleware, uploadChatImage);


module.exports = router;