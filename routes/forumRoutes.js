const express = require('express')
const router = express.Router()
const ForumController = require('../controllers/forumController');



router.get('/api/fetchforumcategories', ForumController.fetchForumCategories);
router.get('/api/forumcategory/:id/:name', ForumController.getForumCategory);
router.post('/api/create/newdiscussion', ForumController.createNewDiscussion);

module.exports = router;