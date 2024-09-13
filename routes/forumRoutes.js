const express = require('express')
const router = express.Router()
const ForumController = require('../controllers/forumController');



router.get('/api/fetchforumcategories', ForumController.fetchForumCategories);
router.get('/api/forumcategory/:id/:name', ForumController.getForumCategory);
router.post('/api/create/newdiscussion', ForumController.createNewDiscussion);
router.get('/api/getdiscussion/:discussion_id', ForumController.getDiscussionById)
router.get('/api/fetchforumtags', ForumController.fetchAllForumTags);

module.exports = router;