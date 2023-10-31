const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');


router.get('/api/getProductCategories', ProductController.getProductCategories);

module.exports = router;