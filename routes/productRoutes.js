const express = require('express')
const router = express.Router()
const ProductController = require('../controllers/productController');
const cacheMiddleware = require('../middleware/cacheMiddleware')


// Product routes
router.post('/api/addnewproduct', ProductController.addNewProduct);
router.get('/api/getallproducts', ProductController.getAllProducts);
router.get('/api/getproductdetails/:id/:product_name', ProductController.getProductDetails);
router.get('/api/getproductbyid/:id', ProductController.getProductById);
router.get('/api/products/getrandom', ProductController.getRandomProducts);

router.delete('/api/deleteproductbyid/:id', ProductController.deleteProductById);

router.put('/api/updateproductbyid/:productId/:product_name', ProductController.updateProduct);

router.put('/api/mark-sold/:productId', ProductController.markSoldProduct);


// Category routes
router.get('/api/getallcategories', cacheMiddleware, ProductController.getAllCategories);
router.get('/api/getcategory/:id/:value', ProductController.getCategoryById);

// Wishlist routes
router.post('/api/addwishlist/product-:id', ProductController.addWishList);
router.post('/api/removewishlist/product-:id', ProductController.removeWishList);
router.get('/api/getallwishlist', ProductController.getAllWishlist);
router.get('/api/getuserwishlist', ProductController.getWishlistByUserId);

// Product view routes
router.post('/api/product/view/:id', ProductController.addProductView);
router.get('/api/product/most-viewed', ProductController.findMostViewedProducts);
router.get('/api/category/most-viewed-product/:categoryId', ProductController.findMostViewedProductsByCategory);

module.exports = router;