const express = require('express');
const router = express.Router();
const FollowerController = require('../controllers/followersController');



router.post('/api/follow-:id', FollowerController.followUser);
router.post('/api/unfollow-:id', FollowerController.unfollowUser);

router.get('/api/get/following-:id', FollowerController.getFollowedUser);
router.get('/api/getall/following-:id', FollowerController.getAllUserFollowing)
router.get('/api/getall/follower-:id', FollowerController.getAllUserFollower)



module.exports = router;
