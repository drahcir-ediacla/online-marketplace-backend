const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');


router.post('/api/addnewproduct', ProductController.addNewProduct);
router.get('/api/getallproducts', ProductController.getAllProducts);
router.get('/api/getproductdetails/:id/:name', ProductController.getProductDetails);
router.get('/api/getallcategories', ProductController.getAllCategories);
router.get('/api/getcategory/:id/:label', ProductController.getCategoryById);

module.exports = router;