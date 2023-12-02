const db = require('../config/dbConfig');
const redisClient = require('../config/redisClient')



const addNewProduct = (req, res) => {
  // Check if the user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required to add a new product.' });
  }

  // The authenticated user's ID is available as req.user.id
  const seller_id = req.user.id;
  const { product_name, description, price, category_id, product_condition, youtube_link } = req.body;
  // const images = req.files; // You won't need this if using Cloudinary direct upload

  if (!product_name || !price || !category_id) {
    return res.status(400).json({ error: 'Name, price, and category are required fields.' });
  }

  const insertProduct = 'INSERT INTO products (product_name, description, price, category_id, seller_id, product_condition, youtube_link) VALUES (?, ?, ?, ?, ?, ?, ?)';

  // Insert the new product into the database with the authenticated user's ID
  db.query(insertProduct, [product_name, description, price, category_id, seller_id, product_condition, youtube_link], (error, results) => {
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
        db.query(insertImage, [newProduct.id, imageUrl], (imageError, imageResults) => {
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
};


const getAllProducts = (req, res) => {
  const getAllProductsQuery = 'SELECT * FROM products';
  db.query(getAllProductsQuery, (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'An error occurred while fetching products.' });
    } else {
      res.status(200).json(results)
    }
  })
}


const getProductDetails = (req, res) => {
  const productID = req.params.id;

  // Validate product name if needed

  const getProductDetailsQuery = 'SELECT * FROM products WHERE id = ?';
  db.query(getProductDetailsQuery, [productID], (error, results) => {
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
    db.query(getProductImagesQuery, [productID], (imageError, imageResults) => {
      if (imageError) {
        console.error('Error fetching product images:', imageError);
        return res.status(500).json({ error: 'An error occurred while fetching product images.' });
      }

      // Add the images array to the productDetails object
      productDetails.images = imageResults;

      // Fetch details of the seller (user)
      const getSellerDetailsQuery = 'SELECT * FROM users WHERE id = ?';
      db.query(getSellerDetailsQuery, [sellerID], (sellerError, sellerResults) => {
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
}



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
  const query = 'SELECT * FROM product_categories';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ message: 'Error fetching categories' });
    } else {
      const key = req.originalUrl || req.url;
      redisClient.setex(key, 60 * 60, JSON.stringify(results)); // Cache for 10 minutes
      const rows = results; // Assuming that the query result is an array of rows
      const categories = mapCategories(rows);
      return res.status(200).json(categories);
    }
  });
};


const getCategoryById = (req, res) => {
  const categoryId = req.params.id;

  const getCategoryQuery = 'SELECT * FROM product_categories WHERE id = ?';
  db.query(getCategoryQuery, [categoryId], (categoryError, categoryResults) => {
    if (categoryError) {
      console.error('Error fetching category:', categoryError);
      return res.status(500).json({ error: 'An error occurred while fetching category.' });
    }

    if (categoryResults.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryData = categoryResults[0];

    const getCategoryProductQuery = 'SELECT * FROM products WHERE category_id = ?';
    db.query(getCategoryProductQuery, [categoryId], (productError, productResults) => {
      if (productError) {
        console.error('Error fetching products:', productError);
        return res.status(500).json({ error: 'An error occurred while fetching category products.' });
      }

      // Add the products array to the categoryData object
      categoryData.products = productResults;


      // Fetch parent category's products
      const getParentCategoryProductsQuery = 'SELECT products.* FROM products INNER JOIN product_categories ON products.category_id = product_categories.id WHERE product_categories.parent_id = ?';
      db.query(getParentCategoryProductsQuery, [categoryId], (parentProductError, parentProductResults) => {
        if (parentProductError) {
          console.error('Error fetching parent category products:', parentProductError);
          return res.status(500).json({ error: 'An error occurred while fetching parent category products.' });
        }

        // Add parent category's products to the categoryData object
        categoryData.parentCategoryProducts = parentProductResults;


        // Fetch users for each product
        const getProductSeller = (sellerID) => {
          const getSellerQuery = 'SELECT * FROM users WHERE id = ?';
          return new Promise((resolve, reject) => {
            db.query(getSellerQuery, [sellerID], (sellerError, sellerResults) => {
              if (sellerError) {
                console.error('Error fetching product seller:', sellerError);
                reject(sellerError);
              } else {
                resolve(sellerResults[0]);
              }
            });
          });
        };

        // Fetch users for each product and add them to the productDetails object
        const fetchProductSellers = async () => {
          for (const product of categoryData.products) {
            try {
              const productSeller = await getProductSeller(product.seller_id);
              product.seller = productSeller;
            } catch (error) {
              console.error('Error fetching product seller:', error);
            }
          }
        };

        
        fetchProductSellers();


        // Fetch images for each product
        const getProductImages = (productID) => {
          const getProductImagesQuery = 'SELECT * FROM product_images WHERE product_id = ?';
          return new Promise((resolve, reject) => {
            db.query(getProductImagesQuery, [productID], (imageError, imageResults) => {
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
              const productImages = await getProductImages(product.id);
              product.images = productImages;
            } catch (error) {
              console.error('Error fetching product images:', error);
            }
          }

          for (const parentProduct of categoryData.parentCategoryProducts) {
            try {
              const parentProductImages = await getProductImages(parentProduct.id);
              parentProduct.images = parentProductImages;
            } catch (error) {
              console.error('Error fetching parent product images:', error);
            }
          }

          res.status(200).json(categoryData);
        };

        fetchProductImages();
      });
    });
  });
};





module.exports = { getCategoryById, getAllCategories, addNewProduct, getAllProducts, getProductDetails };