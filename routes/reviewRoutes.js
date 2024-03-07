const express = require('express')
const router = express.Router()
const ReviewsController = require('../controllers/reviewsController')


router.post('/api/submit-review', ReviewsController.createReviews)


module.exports = router;