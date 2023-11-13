const db = require('../config/dbConfig');



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


const getProductCategories = (req, res) => {
  const query = 'SELECT * FROM product_categories';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ message: 'Error fetching categories' });
    } else {
      const rows = results; // Assuming that the query result is an array of rows
      const categories = mapCategories(rows);
      return res.status(200).json(categories);
    }
  });
};




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
  const productName = req.params.name;

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






module.exports = { getProductCategories, addNewProduct, getAllProducts, getProductDetails };