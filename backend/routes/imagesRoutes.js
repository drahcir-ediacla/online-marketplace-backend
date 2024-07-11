const express = require('express')
const router = express.Router()
const { uploadChatImageMiddleware, uploadChatImage, createReviewImages, uploadReviewImages } = require('../controllers/imagesController')

router.post('/api/upload-chat-image', uploadChatImageMiddleware, uploadChatImage);
router.post('/api/create-review-image', uploadReviewImages, createReviewImages);

module.exports = router;