const express = require('express')
const router = express.Router()
const ForumController = require('../controllers/forumController');



router.get('/api/fetchforumcategories', ForumController.fetchForumCategories);
router.get('/api/forumcategory/:id/:name', ForumController.getForumCategory);
router.post('/api/create/newdiscussion', ForumController.createNewDiscussion);
router.post('/api/post/create', ForumController.createForumPost);
router.get('/api/getdiscussion/:discussion_id', ForumController.getDiscussionById)
router.get('/api/discussions/:discussionId/posts', ForumController.getDiscussionPosts)
router.get('/api/fetchforumtags', ForumController.fetchAllForumTags);
router.get('/api/filtertags', ForumController.filterTags);

module.exports = router;