const { userModel, forumCategoryModel, forumDiscussionModel, forumPostModel } = require('../config/sequelizeConfig')


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


const createNewDiscussion = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to add a new discussion.' });
        }

        const userId = req.user.id;
        const { forum_category_id, title, content } = req.body;

        if (!forum_category_id || !title || !content) {
            return res.status(400).json({ error: 'forum_category_id, title, content are required fields.' });
        }

        const newDiscussion = await forumDiscussionModel.create({
            user_id: userId,
            forum_category_id,
            title,
        })

        await forumPostModel.create({
            discussion_id: newDiscussion.id,
            user_id: userId,
            content,
        })

        res.status(201).json(newDiscussion)

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
}


const getForumCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const category = await forumCategoryModel.findByPk(categoryId, {
            attributes: ['id', 'name', 'description', 'parent_id', 'icon'],
        });

        if (!category) {
            console.error('Category not found for ID:', categoryId);
            return res.status(404).json({ error: 'Category not found' });
        }

        // Find sub-category products
        const subcategories = await forumCategoryModel.findAll({
            where: { parent_id: categoryId },
            attributes: ['id', 'name', 'description', 'parent_id', 'icon'],
        });

        const categoryData = {
            ...category.toJSON(),
            subcategories, // Ensure subcategories is an array even if it's null
        };

        res.status(200).json(categoryData);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
}


module.exports = {
    fetchForumCategories,
    getForumCategory,
    createNewDiscussion
}