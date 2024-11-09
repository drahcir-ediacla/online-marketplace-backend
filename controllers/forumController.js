const { Op } = require('sequelize');
const { userModel, forumCategoryModel, forumDiscussionModel, forumPostModel, discussionTagsModel, tagsModel, forumPostLikesModel, followersModel, forumNotificationModel, forumActivityModel } = require('../config/sequelizeConfig')


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

const oldFetchForumCategories = async (req, res) => {
    try {
        const rows = await forumCategoryModel.findAll();

        // Process the categories
        const categories = mapCategories(rows);

        // Collect all subcategory IDs to fetch discussions
        const subCategoryIds = categories.flatMap((category) =>
            category.subcategories.map((subcategory) => subcategory.id)
        );

        // Fetch discussions for all subcategories
        const allDiscussions = await Promise.all(
            subCategoryIds.map((subCategoryId) =>
                fetchDiscussionsRecursively(subCategoryId)
            )
        );

        // Combine categories and discussions
        const allCategoriesData = {
            categories,
            allDiscussions: allDiscussions.flat(), // Flatten the array of discussions
        };

        res.status(200).json(allCategoriesData);
    } catch (error) {
        console.error('Error fetching forum categories:', error);
        res.status(500).json({ message: 'Error fetching forum categories' });
    }
};


const fetchForumCategories = async (req, res) => {
    try {
        const rows = await forumCategoryModel.findAll();

        // Process the categories
        const categories = mapCategories(rows);

        // Collect all subcategory IDs to fetch discussions
        const subCategoryIds = categories.flatMap((category) =>
            category.subcategories.map((subcategory) => subcategory.id)
        );

        // Fetch discussions for all subcategories
        const allDiscussions = await Promise.all(
            subCategoryIds.map((subCategoryId) =>
                fetchDiscussionsRecursively(subCategoryId)
            )
        );

        // Flatten discussions and map them by subcategory ID for easier lookup
        const flatDiscussions = allDiscussions.flat();
        const discussionsBySubcategory = flatDiscussions.reduce((acc, discussion) => {
            const { forum_category_id } = discussion;
            if (!acc[forum_category_id]) acc[forum_category_id] = [];
            acc[forum_category_id].push(discussion);
            return acc;
        }, {});

        // Add aggregated data to each subcategory
        const enrichedCategories = categories.map((category) => ({
            ...category,
            subcategories: category.subcategories.map((subcategory) => {
                const matchingDiscussions = discussionsBySubcategory[subcategory.id] || [];

                const getTotalReplies = (posts) => {
                    let totalReplies = 0;

                    const countReplies = (post) => {
                        totalReplies += post?.replies?.length || 0;
                        post?.replies?.forEach(countReplies);
                    };

                    posts?.forEach(countReplies);
                    return totalReplies;
                };

                const totalPosts = matchingDiscussions?.reduce((count, discussion) => {
                    const topLevelPostsCount = discussion.post?.length || 0;
                    const repliesCount = getTotalReplies(discussion.post);
                    return count + topLevelPostsCount + repliesCount;
                }, 0);

                let totalViews = 0;
                let latestPostDate = null;

                matchingDiscussions.forEach((discussion) => {
                    const posts = discussion.post || [];

                    // Count total posts and replies
                    posts.forEach((post) => {

                        // Track latest post
                        const allReplies = [post, ...(post.replies || [])];
                        allReplies.forEach((p) => {
                            if (!latestPostDate || new Date(p.created_at) > new Date(latestPostDate)) {
                                latestPostDate = p.created_at;
                            }
                        });
                    });

                    // Accumulate views (assuming views are in the first post of each discussion)
                    totalViews += posts[0]?.views || 0;
                });

                return {
                    ...subcategory,
                    totalPosts,
                    totalViews,
                    latestPost: latestPostDate,
                };
            }),
        }));

        res.status(200).json({ categories: enrichedCategories });
    } catch (error) {
        console.error('Error fetching forum categories:', error);
        res.status(500).json({ message: 'Error fetching forum categories' });
    }
};


const fetchAllForumTags = async (req, res) => {
    try {
        const forumTags = await tagsModel.findAll();
        res.status(200).json(forumTags);
    } catch (error) {
        console.log('Error fetching forum tags:', error)
        res.status(500).json({ error: 'An error occurred while processing the request.' })
    }
}


const getFollowers = async (userId) => {
    try {

        const followers = await followersModel.findAll({
            where: {
                following_id: userId,
            },
            include: [
                {
                    model: userModel,
                    attributes: ['id', 'display_name', 'profile_pic'],
                    as: 'followerInfo'
                }
            ]
        });

        // Extract and return the follower objects
        return followers.map(follower => follower.followerInfo);

    } catch (error) {
        console.error('Error fetching followers:', error);
        throw error;
    }
};

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

        // Get followers of the user who posted the listing
        const followers = await getFollowers(userId);

        // Send notifications to followers
        followers.forEach(async (follower) => {
            try {
                await forumNotificationModel.create({
                    recipient_id: follower.id,
                    subject_user_id: userId,
                    message: `<a href=/forum/discussion/${newDiscussion.discussion_id}?repliedPostId=${newPost.post_id}><span style="font-weight: 600;">${req.user.display_name || 'Anonymous'}</span> created a new discussion: <span style="font-weight: 600;">${title}</span></a>`
                });
            } catch (error) {
                console.error('Error sending notification:', error);
                // Handle error if notification fails to send (optional)
            }
        });

        await forumActivityModel.create({
            subject_user_id: userId,
            message: `<a href=/forum/discussion/${newDiscussion.discussion_id}?repliedPostId=${newPost.post_id}><span style="font-weight: 600;">${req.user.display_name || 'Anonymous'}</span> created a new discussion: <span style="font-weight: 600;">${title}</span></a>`
        });


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

// ------------------- FETCH USER CREATED DISCUSSIONS ------------------- //
const getUserCreatedDiscussions = async (req, res) => {
    try {
        const userId = req.params.user_id

        const discussions = await forumDiscussionModel.findAll({
            where: { user_id: userId },
            attributes: ['discussion_id', 'user_id', 'forum_category_id', 'title', 'created_at', 'updated_at'],
            include: [
                {
                    model: userModel,
                    attributes: ['id', 'display_name', 'profile_pic'],
                    as: 'discussionStarter',
                },
                {
                    model: forumPostModel,
                    where: { parent_post_id: null },  // Top-level posts only
                    attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id', 'views', 'created_at'],
                    as: 'post',
                    include: [
                        {
                            model: forumPostLikesModel,
                            attributes: ['user_id'],
                            as: 'likes',
                        }
                    ]
                }
            ],
        });

        // Make sure that `discussion.post` is properly extracted and handled
        const createdDiscussions = await Promise.all(
            discussions.map(async (discussion) => {
                // Check if `discussion.post` exists and is an array
                const topLevelPosts = Array.isArray(discussion.post) ? discussion.post : [];

                // Flatten top-level posts array and fetch replies
                const postsWithReplies = await Promise.all(
                    topLevelPosts.flat().map(async (post) => {
                        if (post && post.post_id) {
                            const replies = await getRepliesRecursive(post);
                            // const totalLikes = post.likes ? post.likes.length : 0; // Get nested replies
                            return {
                                ...post.toJSON(),
                                // totalLikes,
                                replies,  // Attach nested/flattened replies
                            };
                        }
                        return post;  // In case `post_id` is missing, just return post as is
                    })
                );

                // Calculate total replies for this discussion
                const totalReplies = postsWithReplies.reduce((sum, post) => {
                    const countReplies = (p) => 1 + p.replies.reduce((acc, r) => acc + countReplies(r), 0);
                    return sum + countReplies(post) - 1; // Subtracting 1 for the initial post itself
                }, 0);

                return {
                    ...discussion.toJSON(),
                    // post: postsWithReplies,  // Attach posts with replies to the discussion
                    totalReplies, // Attach total replies
                };
            })
        );

        res.status(200).json(createdDiscussions)
    } catch (err) {
        console.error('Error fetching created discussions:', err);
        res.status(500).json({ error: 'Error fetching created discussions', details: err.message });
    }
}

// ------------------- FETCH USER JOINED DISCUSSIONS ------------------- //
const getUserJoinedDiscussions = async (req, res) => {
    try {
        const userId = Number(req.params.user_id);

        // Fetch discussions where the user has posted or replied
        const allDiscussions = await forumDiscussionModel.findAll({
            attributes: ['discussion_id', 'user_id', 'forum_category_id', 'title', 'created_at', 'updated_at'],
            include: [
                {
                    model: userModel,
                    attributes: ['id', 'display_name', 'profile_pic'],
                    as: 'discussionStarter',
                },
                {
                    model: forumPostModel,
                    where: { parent_post_id: null },  // Top-level posts only
                    attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id', 'views', 'created_at'],
                    as: 'post',
                    include: [
                        {
                            model: forumPostLikesModel,
                            attributes: ['user_id'],
                            as: 'likes',
                        }
                    ]
                }
            ]
        });

        // Attach replies to discussions
        const discussionsWithReplies = await Promise.all(
            allDiscussions.map(async (discussion) => {
                const topLevelPosts = Array.isArray(discussion.post) ? discussion.post : [];

                const postsWithReplies = await Promise.all(
                    topLevelPosts.map(async (post) => {
                        if (post && post.post_id) {
                            const replies = await getRepliesRecursive(post);
                            return {
                                ...post.toJSON(),
                                replies,
                            };
                        }
                        return post;
                    })
                );

                // Calculate total replies for this discussion
                const totalReplies = postsWithReplies.reduce((sum, post) => {
                    const countReplies = (p) => 1 + p.replies.reduce((acc, r) => acc + countReplies(r), 0);
                    return sum + countReplies(post) - 1; // Subtracting 1 for the initial post itself
                }, 0);

                return {
                    ...discussion.toJSON(),
                    post: postsWithReplies,
                    totalReplies,
                };
            })
        );

        // console.log("Discussions with Replies:", JSON.stringify(discussionsWithReplies, null, 2));

        // Filter discussions based on user replies at any reply level
        const joinedDiscussions = discussionsWithReplies.filter(discussion =>
            discussion.post?.some(post =>
                post.replies?.some(levelOneReply => levelOneReply.user_id === userId ||
                    levelOneReply.replies?.some(levelTwoReply => levelTwoReply.user_id === userId ||
                        levelTwoReply.replies?.some(levelThreeReply => levelThreeReply.user_id === userId)
                    )
                )
            )
        );

        // console.log("Joined Discussions:", JSON.stringify(joinedDiscussions, null, 2));
        res.status(200).json(joinedDiscussions);
    } catch (err) {
        console.error('Error fetching joined discussions:', err);
        res.status(500).json({ error: 'Error fetching joined discussions', details: err.message });
    }
};



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
                    attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id', 'level'],
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

// ------------------- CREATE POST ------------------- //

const createForumPost = async (req, res) => {

    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to add a new post.' });
        }
        const userId = req.user.id
        const { content, discussion_id, parent_post_id, title, user_id, postCreatorName } = req.body

        if (!parent_post_id || !discussion_id || !content || !title) {
            return res.status(400).json({ error: 'content are required fields.' });
        }

        // Find parent post to determine the level
        let level = 0;
        if (parent_post_id) {
            const parentPost = await forumPostModel.findByPk(parent_post_id);
            if (parentPost) {
                level = parentPost.level + 1;
            }
        }

        // Limit nesting to 3 levels
        // if (level > 3) {
        //     return res.status(400).json({ error: 'Nesting limit exceeded' });
        // }

        const post = await forumPostModel.create({
            content,
            user_id: userId,
            discussion_id,
            parent_post_id,
            level
        });

        if (post && user_id !== userId) {
            await forumNotificationModel.create({
                recipient_id: user_id,
                subject_user_id: userId,
                message: `<a href=/forum/discussion/${discussion_id}?repliedPostId=${post.post_id}><span style="font-weight: 600;">${req.user.display_name || 'Anonymous'}</span> commented on your post in the discussion: <span style="font-weight: 600;">${title}</span></a>`
            });

            await forumActivityModel.create({
                subject_user_id: userId,
                message: `<a href=/forum/discussion/${discussion_id}?repliedPostId=${post.post_id}><span style="font-weight: 600;">${req.user.display_name || 'Anonymous'}</span> commented on <span style="font-weight: 600;">${postCreatorName}'s</span> post in the discussion: <span style="font-weight: 600;">${title}</span></a>`
            });
        }

        res.status(201).json(post);

    } catch (error) {
        res.status(500).json({ error: 'Error creating post' });
    }
}


// ------------------- FETCH FORUM DISCUSSION POSTS ------------------- //

const getRepliesRecursive = async (post) => {
    // Fetch the replies for the current post
    const replies = await forumPostModel.findAll({
        where: { parent_post_id: post.post_id },
        include: [
            {
                model: userModel,
                attributes: ['id', 'display_name', 'profile_pic'],
                as: 'postCreator',
            },
            {
                model: forumPostLikesModel,
                attributes: ['user_id'],
                as: 'likes'
            }
        ]
    });

    const allReplies = [];

    await Promise.all(
        replies.map(async (reply) => {
            // Safe check if postCreator exists before accessing its properties
            const postCreator = post.postCreator || {};

            if (reply.level >= 3) {
                // Flatten replies for levels 3 and higher
                allReplies.push({
                    ...reply.toJSON(),
                    replies: [],  // No further nesting
                    parentPostContent: post.content,  // Pass parent content
                    parentPostCreator: {
                        id: postCreator.id || null,
                        display_name: postCreator.display_name || 'Unknown',  // Safe fallback for missing user data
                    }
                });

                // Check for deeper replies
                const deeperReplies = await getRepliesRecursive(reply);

                // Flatten the deeper replies
                allReplies.push(...deeperReplies);
            } else {
                // Recursively get nested replies for levels 0-2
                const nestedReplies = await getRepliesRecursive(reply);

                allReplies.push({
                    ...reply.toJSON(),
                    replies: nestedReplies,  // Keep nesting for levels 0-2
                    parentPostContent: post.content,
                    parentPostCreator: {
                        id: postCreator.id || null,
                        display_name: postCreator.display_name || 'Unknown',  // Safe fallback for missing user data
                    }
                });
            }
        })
    );

    return allReplies;
};


const getDiscussionPosts = async (req, res) => {
    try {
        const { discussionId } = req.params;

        // Fetch top-level posts
        const topLevelPosts = await forumPostModel.findAll({
            where: {
                discussion_id: discussionId,
                level: 0,  // Fetch only top-level posts
            },
            include: [
                {
                    model: forumDiscussionModel,
                    attributes: ['title'],
                    as: 'discussion'
                },
                {
                    model: userModel,
                    attributes: ['id', 'display_name', 'profile_pic'],
                    as: 'postCreator',
                },
                {
                    model: forumPostLikesModel,
                    attributes: ['user_id'],
                    as: 'likes'
                }
            ]
        });

        // For each top-level message, recursively get its replies
        const messagesWithReplies = await Promise.all(
            topLevelPosts.map(async (message) => {
                const replies = await getRepliesRecursive(message);
                return {
                    ...message.toJSON(),
                    replies: replies  // Merged replies (nested + flat)
                };
            })
        );

        res.json(messagesWithReplies);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Error fetching posts', details: error.message });
    }
};



// ------------------- GET FORUM CATEGORY ------------------- //

const fetchDiscussionsRecursively = async (categoryId, limit, offset) => {
    // const category = await forumCategoryModel.findByPk(categoryId, {
    //     attributes: ['id', 'parent_id', 'name', 'description', 'icon'],
    // });

    // if (!category) {
    //     return [];
    // }

    // Fetch discussions in the current category with pagination (limit and offset)
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
                where: { parent_post_id: null },  // Top-level posts only
                attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id', 'views', 'created_at'],
                as: 'post',
                include: [
                    {
                        model: forumPostLikesModel,
                        attributes: ['user_id'],
                        as: 'likes',
                    }
                ]
            }
        ],
        limit,
        offset,
    });

    // Make sure that `discussion.post` is properly extracted and handled
    const discussionsWithReplies = await Promise.all(
        discussions.map(async (discussion) => {
            // Check if `discussion.post` exists and is an array
            const topLevelPosts = Array.isArray(discussion.post) ? discussion.post : [];

            // Flatten top-level posts array and fetch replies
            const postsWithReplies = await Promise.all(
                topLevelPosts.flat().map(async (post) => {
                    if (post && post.post_id) {
                        const replies = await getRepliesRecursive(post);  // Get nested replies
                        return {
                            ...post.toJSON(),
                            replies,  // Attach nested/flattened replies
                        };
                    }
                    return post;  // In case `post_id` is missing, just return post as is
                })
            );

            return {
                ...discussion.toJSON(),
                post: postsWithReplies,  // Attach posts with replies to the discussion
            };
        })
    );

    // Fetch child subcategories of the current category
    const childSubcategories = await forumCategoryModel.findAll({
        where: { parent_id: categoryId },
        attributes: ['id', 'name', 'description', 'parent_id', 'icon'],
    });

    // Fetch subcategory discussions with pagination applied to each subcategory
    const subCategoryDiscussions = await Promise.all(
        childSubcategories.map((subCategory) =>
            fetchDiscussionsRecursively(subCategory.id, limit, offset)  // Apply pagination for each subcategory
        )
    );

    // Combine discussions from the current category and its subcategories
    const allDiscussions = [...discussionsWithReplies, ...subCategoryDiscussions.flat()];

    return allDiscussions;
};


// Fetch total discussions count for pagination
const fetchTotalDiscussions = async (categoryId) => {
    const totalCount = await forumDiscussionModel.count({
        where: { forum_category_id: categoryId },
    });
    return totalCount;
};

// Get forum category with pagination support
const getForumCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Get pagination parameters from query
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

        // Calculate the offset
        const offset = (page - 1) * limit;

        const category = await forumCategoryModel.findByPk(categoryId, {
            attributes: ['id', 'name', 'description', 'parent_id', 'icon'],
        });

        if (!category) {
            console.error('Category not found for ID:', categoryId);
            return res.status(404).json({ error: 'Category not found' });
        }

        // Find subcategories
        const subcategories = await forumCategoryModel.findAll({
            where: { parent_id: categoryId },
            attributes: ['id', 'name', 'description', 'parent_id', 'icon'],
        });

        // Fetch discussions with pagination (limit and offset)
        const recursiveDiscussions = await fetchDiscussionsRecursively(categoryId, limit, offset);

        const allDiscussions = [...recursiveDiscussions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Count the total number of discussions for pagination metadata
        const totalDiscussions = await fetchTotalDiscussions(categoryId);

        // Calculate total pages
        const totalPages = Math.ceil(totalDiscussions / limit);

        // Prepare the response with category data and pagination
        const categoryData = {
            ...category.toJSON(),
            subcategories, // Ensure subcategories is an array even if it's null
            allDiscussions,
            pagination: {
                page,
                limit,
                totalPages,
                totalDiscussions,
            },
        };

        res.status(200).json(categoryData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
};




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
                    as: 'allDiscussionsInTag',
                    include: [
                        {
                            model: userModel,
                            attributes: ['id', 'display_name', 'profile_pic'],
                            as: 'discussionStarter',
                        },
                        {
                            model: forumPostModel,
                            attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'parent_post_id', 'views'],
                            as: 'post',
                            include: [
                                {
                                    model: forumPostLikesModel,
                                    attributes: ['user_id'],
                                    as: 'likes'
                                }
                            ]
                        }
                    ]
                }
            ],
        });

        res.status(200).json(discussions);

    } catch (error) {
        console.error('Error fetching discussions:', error);
        res.status(500).json({ message: 'Server error' });
    }
}



const forumPostViews = async (req, res) => {
    try {
        const postId = req.params.post_id;
        const post = await forumPostModel.findByPk(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Increment the views count
        post.views += 1;
        await post.save();

        res.status(200).json({ message: 'Post view updated', views: post.views });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}


const forumPostLikeUnlike = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication is required' });
    }

    const userId = req.user.id;
    const { post_id, discussion_id, title, user_id, postCreatorName } = req.body;

    // Validate input parameters
    if (!post_id || !discussion_id || !title || !user_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const post = await forumPostModel.findByPk(post_id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Check if the user has already liked the post
        const existingLike = await forumPostLikesModel.findOne({ where: { user_id: userId, post_id } });

        // If the user hasn't liked the post yet
        if (!existingLike) {
            await forumPostLikesModel.create({ user_id: userId, post_id });

            const notifMessage = user_id === userId
                ? `<a href=/forum/discussion/${discussion_id}?repliedPostId=${post_id}><span style="font-weight: 600;">You</span> liked your own post in the discussion: <span style="font-weight: 600;">${title}</span></a>`
                : `<a href=/forum/discussion/${discussion_id}?repliedPostId=${post_id}><span style="font-weight: 600;">${req.user.display_name || 'Anonymous'}</span> liked your post in the discussion: <span style="font-weight: 600;">${title}</span></a>`;

            const activityMessage = user_id === userId
                ? `<a href=/forum/discussion/${discussion_id}?repliedPostId=${post_id}><span style="font-weight: 600;">${req.user.display_name}</span> liked his/her own post in the discussion: <span style="font-weight: 600;">${title}</span></a>`
                : `<a href=/forum/discussion/${discussion_id}?repliedPostId=${post_id}><span style="font-weight: 600;">${req.user.display_name}</span> liked <span style="font-weight: 600;">${postCreatorName}'s</span> post in the discussion: <span style="font-weight: 600;">${title}</span></a>`

            await forumNotificationModel.create({
                recipient_id: user_id,
                subject_user_id: userId,
                message: notifMessage
            });

            await forumActivityModel.create({
                subject_user_id: userId,
                message: activityMessage
            });

            return res.status(200).json({ success: true, action: 'liked' });
        } else {
            // User has already liked the post, so unlike it
            await existingLike.destroy();
            return res.status(200).json({ success: true, action: 'unliked' });
        }

    } catch (error) {
        console.error('Error in forumPostLikeUnlike:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};




module.exports = {
    fetchForumCategories,
    oldFetchForumCategories,
    getForumCategory,
    createNewDiscussion,
    getUserCreatedDiscussions,
    getUserJoinedDiscussions,
    getDiscussionById,
    createForumPost,
    getDiscussionPosts,
    fetchAllForumTags,
    filterTags,
    forumPostViews,
    forumPostLikeUnlike
}