const pool = require('../config/dbConfig');
const { Sequelize } = require('sequelize');
const db = require('../config/dbConfig');
const { userModel, productModel, subCategoryProductModel, categoryModel, productImagesModel } = require('../config/sequelizeConfig')
const redisClient = require('../config/redisClient')


// --------------- GET ADD NEW PRODUCT  --------------- //
const addNewProduct = (req, res) => {
  // Check if the user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required to add a new product.' });
  }

  // The authenticated user's ID is available as req.user.id
  const seller_id = req.user.id;
  const { product_name, description, price, category_id, product_condition, youtube_link } = req.body;

  if (!product_name || !price || !category_id) {
    return res.status(400).json({ error: 'Name, price, and category are required fields.' });
  }

  // Use pool.getConnection to obtain a connection from the pool
  pool.getConnection((getConnectionError, connection) => {
    if (getConnectionError) {
      console.error('Error getting connection:', getConnectionError);
      return res.status(500).json({ error: 'An error occurred while getting a database connection.' });
    }

    const insertProduct = 'INSERT INTO products (product_name, description, price, category_id, seller_id, product_condition, youtube_link) VALUES (?, ?, ?, ?, ?, ?, ?)';

    // Use the obtained connection to execute the product insertion query
    connection.query(insertProduct, [product_name, description, price, category_id, seller_id, product_condition, youtube_link], (error, results) => {
      // Release the connection back to the pool
      connection.release();

      if (error) {
        console.error('Error inserting product:', error);
        return res.status(500).json({ error: 'An error occurred while inserting the product.' });
      }

      const newProduct = {
        id: results.insertId,
        product_name,
        description,
        price,
        category_id,
        seller_id,
        product_condition,
        youtube_link,
      };

      // Assuming you have image URLs from Cloudinary in your request (client-side)
      const imageUrls = req.body.imageUrls;

      const insertImage = 'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)';

      // Loop through the image URLs and insert them into the database
      const imageInsertPromises = imageUrls.map((imageUrl) => {
        return new Promise((resolve, reject) => {
          // Use the obtained connection to execute the image insertion query
          connection.query(insertImage, [newProduct.id, imageUrl], (imageError, imageResults) => {
            if (imageError) {
              reject(imageError);
            } else {
              resolve(imageUrl);
            }
          });
        });
      });

      Promise.all(imageInsertPromises)
        .then(() => {
          newProduct.image_urls = imageUrls;
          res.status(201).json(newProduct);
        })
        .catch((insertError) => {
          console.error('Error inserting image URLs:', insertError);
          res.status(500).json({ error: 'An error occurred while inserting image URLs.' });
        });
    });
  });
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
      ],
    });

    res.status(200).json(productDetails);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'An error occurred while fetching products.' });
  }
};






// --------------- GET PRODUCT BY ID --------------- //
const getProductDetails = (req, res) => {
  const productID = req.params.id;

  // Use pool.getConnection to obtain a connection from the pool
  pool.getConnection((getConnectionError, connection) => {
    if (getConnectionError) {
      console.error('Error getting connection:', getConnectionError);
      return res.status(500).json({ error: 'An error occurred while getting a database connection.' });
    }

    // Validate product name if needed

    const getProductDetailsQuery = 'SELECT * FROM products WHERE id = ?';
    // Use the obtained connection to execute the main query
    connection.query(getProductDetailsQuery, [productID], (error, results) => {
      // Release the connection back to the pool
      connection.release();

      if (error) {
        console.error('Error fetching product details:', error);
        return res.status(500).json({ error: 'An error occurred while fetching product details.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Product not found.' });
      }

      const productDetails = results[0];
      const sellerID = productDetails.seller_id;

      // Fetch associated images for the product
      const getProductImagesQuery = 'SELECT * FROM product_images WHERE product_id = ?';
      // Use pool.getConnection to obtain a connection for the image query
      pool.getConnection((getImageConnectionError, imageConnection) => {
        if (getImageConnectionError) {
          console.error('Error getting image connection:', getImageConnectionError);
          return res.status(500).json({ error: 'An error occurred while getting a database connection for images.' });
        }

        // Use the obtained connection to execute the image query
        imageConnection.query(getProductImagesQuery, [productID], (imageError, imageResults) => {
          // Release the image connection back to the pool
          imageConnection.release();

          if (imageError) {
            console.error('Error fetching product images:', imageError);
            return res.status(500).json({ error: 'An error occurred while fetching product images.' });
          }

          // Add the images array to the productDetails object
          productDetails.images = imageResults;

          // Fetch details of the seller (user)
          const getSellerDetailsQuery = 'SELECT * FROM users WHERE id = ?';
          // Use pool.getConnection to obtain a connection for the seller query
          pool.getConnection((getSellerConnectionError, sellerConnection) => {
            if (getSellerConnectionError) {
              console.error('Error getting seller connection:', getSellerConnectionError);
              return res.status(500).json({ error: 'An error occurred while getting a database connection for the seller.' });
            }

            // Use the obtained connection to execute the seller query
            sellerConnection.query(getSellerDetailsQuery, [sellerID], (sellerError, sellerResults) => {
              // Release the seller connection back to the pool
              sellerConnection.release();

              if (sellerError) {
                console.error('Error fetching seller details:', sellerError);
                return res.status(500).json({ error: 'An error occurred while fetching seller details.' });
              }

              if (sellerResults.length === 0) {
                return res.status(404).json({ error: 'Seller not found.' });
              }

              const sellerDetails = sellerResults[0];
              productDetails.seller = sellerDetails;

              res.status(200).json(productDetails);
            });
          });
        });
      });
    });
  });
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
          attributes: ['id','fb_id','display_name','profile_pic','createdAt','bio','first_name','last_name','country','phone','gender','birthday','city', 'region'],
          as: 'seller',
          where: { id: Sequelize.col('Product.seller_id') },
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
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
          attributes: ['id','fb_id','display_name','profile_pic','createdAt','bio','first_name','last_name','country','phone','gender','birthday','city', 'region'],
          as: 'seller',
          where: { id: Sequelize.col('Product.seller_id') },
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Add products and sub-category products to the category data
    const categoryData = {
      ...category.toJSON(),
      products,
      subCategoryProducts,
    };

    // // Fetch sellers and images for products
    // await Promise.all([
    //   fetchProductDetails(categoryData.products),
    //   fetchProductDetails(categoryData.subCategoryProducts),
    // ]);

    res.status(200).json(categoryData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
};

// const fetchProductDetails = async (products) => {
//   // Fetch sellers and images for each product
//   for (const product of products) {
//     try {
//       const seller = await userModel.findByPk(product.seller_id);
//       const images = await productImagesModel.findAll({ where: { product_id: product.id } });

//       product.seller = seller.toJSON();
//       product.images = images.map((image) => image.toJSON());
//     } catch (error) {
//       console.error('Error fetching product details:', error);
//     }
//   }
// };


module.exports = { getCategoryById, getAllCategories, addNewProduct, getAllProducts, getProductDetails };