const { Op } = require('sequelize');
const { userModel, forumCategoryModel, forumDiscussionModel, forumPostModel, discussionTagsModel, tagsModel } = require('../config/sequelizeConfig')


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

const fetchAllForumTags = async (req, res) => {
    try {
        const forumTags = await tagsModel.findAll();
        res.status(200).json(forumTags);
    } catch (error) {
        console.log('Error fetching forum tags:', error)
        res.status(500).json({ error: 'An error occurred while processing the request.' })
    }
}


// ------------------- CREATE NEW DISCUSSION ------------------- //
const createNewDiscussion = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to add a new discussion.' });
        }

        const userId = req.user.id;
        const { forum_category_id, title, content, discussionTags } = req.body;

        if (!forum_category_id || !title || !content) {
            return res.status(400).json({ error: 'forum_category_id, title, content are required fields.' });
        }

        const newDiscussion = await forumDiscussionModel.create({
            user_id: userId,
            forum_category_id,
            title,
        })

        // Create the first post in the discussion
        const newPost = await forumPostModel.create({
            discussion_id: newDiscussion.discussion_id,
            user_id: userId,
            content,
        });


        if (discussionTags && Array.isArray(discussionTags) && discussionTags.length > 0) {
            const tagsInsertPromises = discussionTags.map(discussion => {
                const { tag_id } = discussion;
                return discussionTagsModel.create({
                    discussion_id: newDiscussion.discussion_id,
                    tag_id,
                })
            })
            await Promise.all(tagsInsertPromises)
        }

        // Return the created discussion along with the first post (and potentially more data)
        res.status(201).json({
            message: 'Discussion created successfully.',
            discussion_id: newDiscussion.discussion_id,
            discussion: newDiscussion,
            post: newPost,
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
}

// ------------------- FETCH DISCUSSION BY ID ------------------- //

const getDiscussionById = async (req, res) => {
    try {
        const discussionId = req.params.discussion_id;

        const discussionData = await forumDiscussionModel.findOne({
            where: {
                discussion_id: discussionId
            },
            include: [
                {
                    model: userModel,
                    attributes: ['display_name', 'profile_pic'],
                    as: 'discussionStarter',
                },
                {
                    model: forumPostModel,
                    attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id'],
                    as: 'post',
                    include: [
                        {
                            model: userModel,
                            attributes: ['id', 'display_name', 'profile_pic'],
                            as: 'postCreator',
                        }
                    ]
                }
            ]
        })

        if (!discussionData) {
            return res.status(404).json({ error: 'Product not found.' })
        }

        res.status(201).json(discussionData)
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
}



// ------------------- GET FORUM CATEGORY ------------------- //

const fetchDiscussionsRecursively = async (categoryId) => {
    const category = await forumCategoryModel.findByPk(categoryId, {
        attributes: ['id', 'parent_id', 'name', 'description', 'icon'],
    })

    if (!category) {
        return [];
    }

    const discussions = await forumDiscussionModel.findAll({
        where: { forum_category_id: categoryId },
        attributes: ['discussion_id', 'user_id', 'forum_category_id', 'title', 'created_at', 'updated_at'],
        include: [
            {
                model: userModel,
                attributes: ['id', 'display_name', 'profile_pic'],
                as: 'discussionStarter',
            },
            {
                model: forumPostModel,
                attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id'],
                as: 'post',
            }
        ]
    })


    const childSubcategories = await forumCategoryModel.findAll({
        where: { parent_id: categoryId },
        attributes: ['id', 'name', 'description', 'parent_id'],
    })

    const subCategoryDiscussions = await Promise.all(
        childSubcategories.map((subCategory) =>
            fetchDiscussionsRecursively(subCategory.id)
        )
    );

    const allDiscussions = [...discussions, ...subCategoryDiscussions.flat()];

    return allDiscussions
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

        const allDiscussions = await fetchDiscussionsRecursively(categoryId)

        const categoryData = {
            ...category.toJSON(),
            subcategories, // Ensure subcategories is an array even if it's null
            allDiscussions,
        };


        res.status(200).json(categoryData);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
}


// ------------------- TAGS FILTER ------------------- //



const filterTags = async (req, res) => {
    try {
        const selectedTags = req.query.tag_id?.split(',') || [];

        const discussions = await discussionTagsModel.findAll({
            where: {
                tag_id: selectedTags
            }, 
            include: [
                {
                    model: forumDiscussionModel,
                    attributes: ['discussion_id', 'user_id', 'title', 'created_at'],
                    as: 'allDiscussionsInTag', // Ensure this matches the association alias
                    include: [
                        {
                            model: userModel,
                            attributes: ['id', 'display_name', 'profile_pic'],
                            as: 'discussionStarter',
                        },
                        {
                            model: forumPostModel,
                            attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id'],
                            as: 'post',
                        }
                    ]
                }
            ]
        });

        
        res.status(201).json(discussions);

    } catch (error) {
        console.error('Error fetching discussions:', error);
        res.status(500).json({ message: 'Server error' });
    }
}



module.exports = {
    fetchForumCategories,
    getForumCategory,
    createNewDiscussion,
    getDiscussionById,
    fetchAllForumTags,
    filterTags
}