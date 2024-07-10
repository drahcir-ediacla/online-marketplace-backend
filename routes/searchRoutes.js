const express = require('express')
const router = express.Router()
const SearchQueryController  = require('../controllers/SearchQueryController')

router.get('/api/search', SearchQueryController.searchProducts);

module.exports = router;