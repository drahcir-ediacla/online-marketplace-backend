const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');
const cacheMiddleware = require('../middleware/cacheMiddleware')



router.get('/api/get-all-test-categories', cacheMiddleware, ProductController.getAllCategories);


module.exports = router;