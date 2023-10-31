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


module.exports = {getProductCategories};