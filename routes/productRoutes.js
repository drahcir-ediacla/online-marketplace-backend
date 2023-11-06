const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');


router.get('/api/getproductcategories', ProductController.getProductCategories);
router.post('/api/addnewproduct', ProductController.addNewProduct);

module.exports = router;