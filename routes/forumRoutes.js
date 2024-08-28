const express = require('express')
const router = express.Router()
const ForumController = require('../controllers/forumController');



router.get('/api/fetchforumcategories', ForumController.fetchForumCategories);

module.exports = router;