const db = require('../config/dbConfig');

// Map database rows to the desired structure
function mapCategories(rows) {
    const categoriesMap = new Map();
    const topLevelCategories = [];
  
    rows.forEach((row) => {
      const { id, label, value, icon, parent_id } = row;
  
      // Create a category object
      const category = { label, value, icon, subcategories: [] };
  
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
    const { product_name, description, price, category_id } = req.body;

    if (!product_name || !price || !category_id) {
        return res.status(400).json({ error: 'Name, price, and category are required fields.' });
    }

    const insertProduct = 'INSERT INTO products (product_name, description, price, category_id, seller_id) VALUES (?, ?, ?, ?, ?)';

    // Insert the new product into the database with the authenticated user's ID
    db.query(insertProduct, [product_name, description, price, category_id, seller_id], (error, results) => {
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
        };

        res.status(201).json(newProduct);
    });
};




module.exports = {getProductCategories, addNewProduct};