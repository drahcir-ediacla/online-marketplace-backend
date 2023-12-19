const { Sequelize } = require('sequelize');
const { userModel, productModel, categoryModel, productImagesModel, wishListModel } = require('../config/sequelizeConfig')
const redisClient = require('../config/redisClient')


// --------------- ADD NEW PRODUCT  --------------- //
const addNewProduct = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required to add a new product.' });
    }

    // The authenticated user's ID is available as req.user.id
    const sellerId = req.user.id;
    const { product_name, description, price, category_id, product_condition, youtube_link, imageUrls } = req.body;

    if (!product_name || !price || !category_id) {
      return res.status(400).json({ error: 'Name, price, and category are required fields.' });
    }

    // Use Sequelize to insert a new product
    const newProduct = await productModel.create({
      product_name,
      description,
      price,
      category_id,
      seller_id: sellerId,
      product_condition,
      youtube_link,
    });

    // Insert associated image URLs for the product
    if (imageUrls && imageUrls.length > 0) {
      const imageInsertPromises = imageUrls.map((imageUrl) => {
        return productImagesModel.create({
          product_id: newProduct.id,
          image_url: imageUrl,
        });
      });

      await Promise.all(imageInsertPromises);
      newProduct.image_urls = imageUrls;
    }

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};




// --------------- GET ALL PRODUCTS --------------- //
const getAllProducts = async (req, res) => {
  try {
    // Use Sequelize to fetch all products with associated seller information and images
    const productDetails = await productModel.findAll({
      attributes: ['id', 'product_name', 'description', 'price', 'category_id', 'seller_id', 'product_condition', 'youtube_link', 'createdAt'],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: userModel,
          attributes: ['city', 'region'],
          as: 'seller',
          where: { id: Sequelize.col('Product.seller_id') },
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
        {
          model: wishListModel,
          attributes: ['product_id', 'user_id'],
          as: 'wishlist',
        },
      ],
    });

    res.status(200).json(productDetails);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
};




// --------------- GET PRODUCT BY ID --------------- //
const getProductDetails = async (req, res) => {
  try {
    const productID = req.params.id;

    // Use Sequelize to find the product by ID
    const productDetails = await productModel.findByPk(productID, {
      include: [
        {
          model: userModel,
          attributes: ['id', 'fb_id', 'display_name', 'profile_pic', 'bio', 'first_name', 'last_name', 'country', 'phone', 'gender', 'birthday', 'city', 'region', 'createdAt'],
          as: 'seller',
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
        {
          model: wishListModel,
          attributes: ['user_id', 'product_id'],
          as: 'wishlist',
        }
      ]
    })


    if (!productDetails) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.status(200).json(productDetails);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};


// ------------------- GET ALL CATEGORIES ------------------- //
// Map database rows to the desired structure
function mapCategories(rows) {
  const categoriesMap = new Map();
  const topLevelCategories = [];

  rows.forEach((row) => {
    const { id, label, value, icon, parent_id } = row;

    // Create a category object
    const category = { id, label, value, icon, subcategories: [] };

    // Add the category to the map using its ID
    categoriesMap.set(id, category);

    if (parent_id === null) {
      // If the category has no parent, it's top-level
      topLevelCategories.push(category);
    } else {
      // If it has a parent, add it to the parent's subcategories
      categoriesMap.get(parent_id).subcategories.push(category);
    }
  });

  return topLevelCategories;
}

const getAllCategories = async (req, res) => {
  try {
    // Use Sequelize to fetch all categories
    const rows = await categoryModel.findAll();

    // Process the categories
    const categories = mapCategories(rows);
    const key = req.originalUrl || req.url;

    // Cache the processed categories array instead of row results
    redisClient.setex(key, 600, JSON.stringify(categories)); // Cache for 10 minutes (600 seconds)
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};



// ------------------- GET CATEGORY BY ID ------------------- //
const getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Use Sequelize to find the category by ID
    const category = await categoryModel.findByPk(categoryId);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find products for the category
    const products = await productModel.findAll({
      where: { category_id: categoryId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: userModel,
          attributes: ['id', 'fb_id', 'display_name', 'profile_pic', 'bio', 'first_name', 'last_name', 'country', 'phone', 'gender', 'birthday', 'city', 'region', 'createdAt'],
          as: 'seller',
          where: { id: Sequelize.col('Product.seller_id') },
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
        {
          model: wishListModel,
          attributes: ['product_id', 'user_id'],
          as: 'wishlist',
        },
      ],
    });

    // Find sub-category products
    const subCategoryProducts = await productModel.findAll({
      include: [
        {
          model: categoryModel,
          as: 'category',
          where: { parent_id: categoryId },
        },
        {
          model: userModel,
          attributes: ['id', 'fb_id', 'display_name', 'profile_pic', 'createdAt', 'bio', 'first_name', 'last_name', 'country', 'phone', 'gender', 'birthday', 'city', 'region'],
          as: 'seller',
          where: { id: Sequelize.col('Product.seller_id') },
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
        {
          model: wishListModel,
          attributes: ['product_id', 'user_id'],
          as: 'wishlist',
        },
      ],
      order: [['createdAt', 'DESC']],
    });


    const categoryData = {
      ...category.toJSON(),
      products,
      subCategoryProducts,
    };

    res.status(200).json(categoryData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};


// ------------------- ADD WISHLIST ------------------- //
const addWishList = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required to add an item to the wishlist.' });
    }

    const userId = req.user.id;
    const productId = req.params.id || req.body.id;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required.' });
    }

    // Check if the item already exists in the wishlist
    const existingWishlistItem = await wishListModel.findOne({
      where: {
        user_id: userId,
        product_id: productId,
      },
    });

    if (existingWishlistItem) {
      return res.status(400).json({ error: 'Item already exists in the wishlist.' });
    }

    // If the item doesn't exist, create a new wishlist entry
    await wishListModel.create({
      user_id: userId,
      product_id: productId,
    });

    res.send('Item added to wishlist');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};




// ------------------- REMOVE WISHLIST ------------------- //
const removeWishList = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required to remove an item from the wishlist.' });
    }

    const userId = req.user.id;
    const productId = req.params.id || req.body.id;

    // Assuming you have already defined the Wishlist model
    const removedItem = await wishListModel.destroy({
      where: {
        user_id: userId,
        product_id: productId,
      },
    });

    if (removedItem === 0) {
      // If no rows were affected, the item was not found in the wishlist
      return res.status(404).json({ error: 'Item not found in the wishlist.' });
    }

    res.send('Item removed from wishlist');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};


// ------------------- GET ALL WISHLIST ------------------- //

const getAllWishlist = async (req, res) => {
  try {
    const allWishlist = await wishListModel.findAll({
      attributes: ['user_id', 'product_id'],
      order: [['createdAt', 'DESC']],
    })

    res.status(200).json(allWishlist);

  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'An error occurred while fetching products.' })
  }
}


// ------------------- GET WISHLIST BY USER ID------------------- //

const getWishlistByUserId = async (req, res) => {
  try {
    const userId = req.params.user_id;

    const product = await productModel.findAll({
      attributes: ['id', 'product_name', 'description', 'price', 'category_id', 'seller_id', 'product_condition', 'youtube_link', 'createdAt'],
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: userModel,
          attributes: ['city', 'region'],
          as: 'seller',
          where: { id: Sequelize.col('Product.seller_id') },
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
        {
          model: wishListModel,
          attributes: ['product_id', 'user_id'],
          where: { user_id: userId },
          as: 'wishlist',
        },
      ],
    });


    if (product.length === 0) {
      return res.status(404).json({ error: 'No items in the wishlist' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
};



module.exports = { getCategoryById, getAllCategories, addNewProduct, getAllProducts, getProductDetails, addWishList, removeWishList, getAllWishlist, getWishlistByUserId };