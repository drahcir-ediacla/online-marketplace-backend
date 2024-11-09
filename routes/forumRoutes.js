const express = require('express')
const router = express.Router()
const ForumController = require('../controllers/forumController');



router.get('/api/fetchforumcategories', ForumController.fetchForumCategories);
router.get('/api/oldfetchforumcategories', ForumController.oldFetchForumCategories);
router.get('/api/forumcategory/:id/:name', ForumController.getForumCategory);
router.post('/api/create/newdiscussion', ForumController.createNewDiscussion);
router.get('/api/:user_id/created/discussion', ForumController.getUserCreatedDiscussions)
router.get('/api/:user_id/joined/discussion', ForumController.getUserJoinedDiscussions)
router.post('/api/post/create', ForumController.createForumPost);
router.get('/api/getdiscussion/:discussion_id', ForumController.getDiscussionById)
router.get('/api/discussions/:discussionId/posts', ForumController.getDiscussionPosts)
router.get('/api/fetchforumtags', ForumController.fetchAllForumTags);
router.get('/api/filtertags', ForumController.filterTags);
router.post('/api/post/:post_id/view', ForumController.forumPostViews);
router.post('/api/forum/post/like', ForumController.forumPostLikeUnlike);

module.exports = router;