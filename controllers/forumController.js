const { userModel, forumCategoryModel } = require('../config/sequelizeConfig')


// ------------------- FETCH ALL CATEGORIES ------------------- //
// Map database rows to the desired structure
function mapCategories(rows) {
    const categoriesMap = new Map();
    const topLevelCategories = [];

    rows.forEach((row) => {
        const { id, name, parent_id, description, icon } = row;

        // Create a category object
        const category = { id, name, description, parent_id, icon, subcategories: [] };

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


const fetchForumCategories = async (req, res) => {
    try {
        const rows = await forumCategoryModel.findAll();

        // Process the categories
        const categories = mapCategories(rows);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching forum categories:', error);
        res.status(500).json({ message: 'Error fetching forum categories' });
    }
}

module.exports = {
    fetchForumCategories
}