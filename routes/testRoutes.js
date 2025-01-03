const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');
const cacheMiddleware = require('../middleware/cacheMiddleware')
const verifyRole = require('../middleware/verifyRole')



router.get('/api/get-all-test-categories', cacheMiddleware, verifyRole('Administrator'), ProductController.getAllCategories);


module.exports = router;