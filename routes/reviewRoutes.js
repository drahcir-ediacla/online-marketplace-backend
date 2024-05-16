const express = require('express')
const router = express.Router()
const ReviewsController = require('../controllers/reviewsController')


router.post('/api/submit-review', ReviewsController.createReviews)
router.get('/api/get-reviews/:targetId/:role?', ReviewsController.getReviewsTargetId)


module.exports = router;