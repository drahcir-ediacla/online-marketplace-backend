const express = require('express');
const router = express.Router();
const FollowerController = require('../controllers/followersController');



router.post('/api/follow-:id', FollowerController.followUser);
router.post('/api/unfollow-:id', FollowerController.unfollowUser);

router.get('/api/get/following-:id', FollowerController.getFollowedUser);



module.exports = router;
