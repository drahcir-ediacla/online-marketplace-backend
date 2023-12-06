const pool = require('../config/dbConfig');
const db = require('../config/dbConfig');
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
const getAllProducts = (req, res) => {
  // Use pool.getConnection to obtain a connection from the pool
  pool.getConnection((getConnectionError, connection) => {
    if (getConnectionError) {
      console.error('Error getting connection:', getConnectionError);
      return res.status(500).json({ error: 'An error occurred while getting a database connection.' });
    }

    const getAllProductsQuery = 'SELECT products.*, users.city, users.region FROM products JOIN users ON products.seller_id = users.id ORDER BY products.created_at DESC';

    // Use the obtained connection to execute the main query
    connection.query(getAllProductsQuery, (err, results) => {
      // Release the connection back to the pool
      connection.release();

      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).json({ error: 'An error occurred while fetching products.' });
      } else {
        const productDetails = results;

        // Loop through each product and fetch associated images
        productDetails.forEach((product, index) => {
          const getProductImagesQuery = 'SELECT * FROM product_images WHERE product_id = ?';
          const productID = product.id;

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
              productDetails[index].images = imageResults;

              // Check if this is the last iteration before sending the response
              if (index === productDetails.length - 1) {
                res.status(200).json(productDetails);
              }
            });
          });
        });
      }
    });
  });
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

const getAllCategories = (req, res) => {
  // Use pool.getConnection to obtain a connection from the pool
  pool.getConnection((getConnectionError, connection) => {
    if (getConnectionError) {
      console.error('Error getting connection:', getConnectionError);
      return res.status(500).json({ message: 'Error getting a database connection.' });
    }

    const query = 'SELECT * FROM product_categories';
    // Use the obtained connection to execute the query
    connection.query(query, (err, results) => {
      // Release the connection back to the pool
      connection.release();

      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ message: 'Error fetching categories' });
      } else {
        const rows = results; // Assuming that the query result is an array of rows
        const categories = mapCategories(rows);
        const key = req.originalUrl || req.url;

        // Cache the processed categories array instead of row results
        redisClient.setex(key, 600, JSON.stringify(categories)); // Cache for 10 minutes (600 seconds)
        return res.status(200).json(categories);
      }
    });
  });
};




// ------------------- GET CATEGORY BY ID ------------------- //
const getCategoryById = (req, res) => {
  const categoryId = req.params.id;

  // Use pool.getConnection to obtain a connection from the pool
  pool.getConnection((getConnectionError, connection) => {
    if (getConnectionError) {
      console.error('Error getting connection:', getConnectionError);
      return res.status(500).json({ error: 'An error occurred while getting a database connection.' });
    }

    const getCategoryQuery = 'SELECT * FROM product_categories WHERE id = ?';
    // Use the obtained connection to execute the main query
    connection.query(getCategoryQuery, [categoryId], (categoryError, categoryResults) => {
      // Release the connection back to the pool
      connection.release();

      if (categoryError) {
        console.error('Error fetching category:', categoryError);
        return res.status(500).json({ error: 'An error occurred while fetching category.' });
      }

      if (categoryResults.length === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const categoryData = categoryResults[0];

      const getCategoryProductQuery = 'SELECT * FROM products WHERE category_id = ? ORDER BY products.created_at DESC';
      // Use pool.getConnection to obtain a connection for the product query
      pool.getConnection((getProductConnectionError, productConnection) => {
        if (getProductConnectionError) {
          console.error('Error getting product connection:', getProductConnectionError);
          return res.status(500).json({ error: 'An error occurred while getting a database connection for products.' });
        }

        // Use the obtained connection to execute the product query
        productConnection.query(getCategoryProductQuery, [categoryId], (productError, productResults) => {
          // Release the product connection back to the pool
          productConnection.release();

          if (productError) {
            console.error('Error fetching products:', productError);
            return res.status(500).json({ error: 'An error occurred while fetching category products.' });
          }

          // Add the products array to the categoryData object
          categoryData.products = productResults;

          // Fetch parent category's products
          const getSubCategoryProductsQuery = 'SELECT products.* FROM products INNER JOIN product_categories ON products.category_id = product_categories.id WHERE product_categories.parent_id = ? ORDER BY products.created_at DESC';
          // Use pool.getConnection to obtain a connection for the sub-category product query
          pool.getConnection((getSubProductConnectionError, subProductConnection) => {
            if (getSubProductConnectionError) {
              console.error('Error getting sub-category product connection:', getSubProductConnectionError);
              return res.status(500).json({ error: 'An error occurred while getting a database connection for sub-category products.' });
            }

            // Use the obtained connection to execute the sub-category product query
            subProductConnection.query(getSubCategoryProductsQuery, [categoryId], (subProductError, subProductResults) => {
              // Release the sub-category product connection back to the pool
              subProductConnection.release();

              if (subProductError) {
                console.error('Error fetching parent category products:', subProductError);
                return res.status(500).json({ error: 'An error occurred while fetching parent category products.' });
              }

              // Add parent category's products to the categoryData object
              categoryData.subCategoryProducts = subProductResults;

              // Fetch users for each product
              const getProductSeller = (sellerID, connection) => {
                const getSellerQuery = 'SELECT * FROM users WHERE id = ?';
                return new Promise((resolve, reject) => {
                  // Use the provided connection to execute the seller query
                  connection.query(getSellerQuery, [sellerID], (sellerError, sellerResults) => {
                    if (sellerError) {
                      console.error('Error fetching product seller:', sellerError);
                      reject(sellerError);
                    } else {
                      resolve(sellerResults[0]);
                    }
                  });
                });
              };

              // Fetch users for each product and add them to the subCategoryProducts object
              const fetchSubProductSellers = async () => {
                for (const subProduct of categoryData.subCategoryProducts) {
                  try {
                    const productSeller = await getProductSeller(subProduct.seller_id, subProductConnection);
                    subProduct.seller = productSeller;
                  } catch (error) {
                    console.error('Error fetching product seller:', error);
                  }
                }
              };

              fetchSubProductSellers();

              // Fetch users for each product and add them to the productDetails object
              const fetchProductSellers = async () => {
                for (const product of categoryData.products) {
                  try {
                    const productSeller = await getProductSeller(product.seller_id, productConnection);
                    product.seller = productSeller;
                  } catch (error) {
                    console.error('Error fetching product seller:', error);
                  }
                }
              };

              fetchProductSellers();

              // Fetch images for each product
              const getProductImages = (productID, connection) => {
                const getProductImagesQuery = 'SELECT * FROM product_images WHERE product_id = ?';
                return new Promise((resolve, reject) => {
                  // Use the provided connection to execute the image query
                  connection.query(getProductImagesQuery, [productID], (imageError, imageResults) => {
                    if (imageError) {
                      console.error('Error fetching product images:', imageError);
                      reject(imageError);
                    } else {
                      resolve(imageResults);
                    }
                  });
                });
              };

              // Fetch images for each product and add them to the productDetails object
              const fetchProductImages = async () => {
                for (const product of categoryData.products) {
                  try {
                    const productImages = await getProductImages(product.id, productConnection);
                    product.images = productImages;
                  } catch (error) {
                    console.error('Error fetching product images:', error);
                  }
                }

                for (const subProduct of categoryData.subCategoryProducts) {
                  try {
                    const subProductImages = await getProductImages(subProduct.id, subProductConnection);
                    subProduct.images = subProductImages;
                  } catch (error) {
                    console.error('Error fetching parent product images:', error);
                  }
                }

                // Release the main response
                res.status(200).json(categoryData);
              };

              fetchProductImages();
            });
          });
        });
      });
    });
  });
};






module.exports = { getCategoryById, getAllCategories, addNewProduct, getAllProducts, getProductDetails };