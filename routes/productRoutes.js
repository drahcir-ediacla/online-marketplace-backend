const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');


router.get('/api/getproductcategories', ProductController.getProductCategories);
router.post('/api/addnewproduct', ProductController.addNewProduct);
router.get('/api/getallproducts', ProductController.getAllProducts);
router.get('/api/getproductdetails/:id/:name', ProductController.getProductDetails);

module.exports = router;