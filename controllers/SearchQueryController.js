const { Sequelize } = require('sequelize');
const geolib = require('geolib');
const { sequelize, userModel, productModel, categoryModel, productImagesModel, wishListModel, forumDiscussionModel, forumPostModel, forumPostLikesModel } = require('../config/sequelizeConfig');

// --------------- SEARCH ITEMS GLOBALLY  --------------- //
const searchProducts = async (req, res) => {
  try {
    // Extract filters and sorting options from query parameters
    const filters = {
      minPrice: req.query.minPrice || undefined,
      maxPrice: req.query.maxPrice || undefined,
      condition: req.query.condition || '',
      sort: req.query.sort || '',
    };

    const { keyword, location, latitude, longitude, radius } = req.query;

    // Initialize location filter based on provided location
    let locationFilter = {};

    if (location === 'Listings Nearby' && latitude && longitude && radius) {
      // Skip city, region, and country filters if 'Listing Near Me' is used
      locationFilter = {};
    } else {
      // Replace 'All of the Philippines' with 'Philippines'
      const cleanedLocation = location.replace('All of the Philippines', 'Philippines');

      // Split the cleaned location into an array
      const locationsArray = cleanedLocation.split(' | ').map(loc => loc.trim());

      // Build location filter
      locationFilter = {
        [Sequelize.Op.or]: [
          { city: { [Sequelize.Op.in]: locationsArray } },
          { region: locationsArray },
          { country: locationsArray },
        ],
      };
    }

    // Filtering logic for products
    let productFilter = {
      [Sequelize.Op.or]: [
        {
          product_name: {
            [Sequelize.Op.like]: `%${keyword}%`,
          },
        },
        {
          description: {
            [Sequelize.Op.like]: `%${keyword}%`,
          },
        },
        {
          '$category.label$': {
            [Sequelize.Op.like]: `%${keyword}%`,
          },
        },
      ],
    };

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      // Add price range filter
      productFilter.price = {
        [Sequelize.Op.between]: [filters.minPrice, filters.maxPrice],
      };
    }

    if (filters.condition) {
      // Add condition filter
      productFilter.product_condition = filters.condition;
    }

    // Include category in the search
    const products = await productModel.findAll({
      where: productFilter,
      include: [
        {
          model: categoryModel,
          attributes: ['label'],
          as: 'category',
        },
        {
          model: userModel,
          attributes: ['city', 'region', 'country'],
          as: 'seller',
          where: locationFilter,
        },
        {
          model: userModel,
          attributes: ['latitude', 'longitude'],
          as: 'sellerLocation',
        },
        {
          model: productImagesModel,
          attributes: ['id', 'image_url'],
          as: 'images',
        },
        {
          model: wishListModel,
          attributes: ['product_id', 'user_id'],
          as: 'wishlist',
        },
      ],
      order: getSortingOrder(filters.sort),
    });


    // Filter products by distance if latitude and longitude are provided
    let filteredProducts = products;
    if (latitude && longitude && radius) {
      const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      filteredProducts = products.filter(product => {
        if (!product.sellerLocation) return false; // Skip products without location
        const productLocation = { latitude: product.sellerLocation.latitude, longitude: product.sellerLocation.longitude };
        const distance = geolib.getDistance(userLocation, productLocation);
        console.log(`Product ID ${product.id} distance:`, distance);
        return distance <= radius * 1000; // radius in kilometers
      });
    }



    // Format the products as per the desired JSON structure
    const formattedProducts = filteredProducts.map(product => ({
      id: product.id,
      product_name: product.product_name,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
      seller_id: product.seller_id,
      product_condition: product.product_condition,
      youtube_link: product.youtube_link,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category ? product.category.label : null,
      seller: {
        city: product.seller.city,
        region: product.seller.region,
        country: product.seller.country,
      },
      sellerLocation: product.sellerLocation ? {
        latitude: product.sellerLocation.latitude,
        longitude: product.sellerLocation.longitude
      } : null,
      images: product.images.map(image => ({
        id: image.id,
        image_url: image.image_url,
      })),
      wishlist: product.wishlist.map(wish => ({
        product_id: wish.product_id,
        user_id: wish.user_id,
      })),
    }));

    res.status(200).json(formattedProducts);

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'An error occurred while searching products.' });
  }
};

// Helper function to get sorting order
const getSortingOrder = (sort) => {
  switch (sort) {
    case 'recent':
      return [['createdAt', 'DESC']];
    case 'highToLow':
      return [['price', 'DESC'], ['createdAt', 'DESC']];
    case 'lowToHigh':
      return [['price', 'ASC'], ['createdAt', 'DESC']];
    // Add more sorting options as needed
    default:
      return [['createdAt', 'DESC']];
  }
};


const searchForumPost = async (req, res) => {
  try {
    const { keyword } = req.body;

    // Filtering logic based on whether the keyword is in the title or post content
    const discussionFilter = {
      [Sequelize.Op.or]: [
        { title: { [Sequelize.Op.like]: `%${keyword}%` } }, // Check in title
        { '$post.content$': { [Sequelize.Op.like]: `%${keyword}%` } }, // Check in post content
      ],
    };

    const discussions = await forumDiscussionModel.findAll({
      where: discussionFilter,
      attributes: ['discussion_id', 'user_id', 'forum_category_id', 'title', 'created_at', 'updated_at'],
      include: [
        {
          model: userModel,
          attributes: ['id', 'display_name', 'profile_pic'],
          as: 'discussionStarter',
        },
        {
          model: forumPostModel,
          required: true,
          where: {
            [Sequelize.Op.or]: [
              {
                // If keyword is in title, only level 0 posts
                [Sequelize.Op.and]: [
                  { '$ForumDiscussion.title$': { [Sequelize.Op.like]: `%${keyword}%` } },
                  { level: 0 }
                ]
              },
              {
                // If keyword is in post content, match specific posts with the keyword in content
                content: { [Sequelize.Op.like]: `%${keyword}%` }
              }
            ]
          },
          attributes: ['post_id', 'discussion_id', 'user_id', 'content', 'level', 'parent_post_id', 'views', 'created_at'],
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


    // Flatten posts within each discussion
    const flattenedDiscussions = discussions.flatMap(discussion => 
      discussion.post.map(post => ({
        discussion_id: discussion.discussion_id,
        discussion_title: discussion.title,
        discussion_user_id: discussion.user_id,
        discussion_category_id: discussion.forum_category_id,
        discussion_created_at: discussion.created_at,
        discussion_updated_at: discussion.updated_at,
        discussionStarter: discussion.discussionStarter,
        post
      }))
    );

    res.status(200).json(flattenedDiscussions);

  } catch (err) {
    console.error('Error searching forum posts:', err);
    res.status(500).json({ error: 'An error occurred while searching forum posts.' });
  }
};



module.exports = { searchProducts, searchForumPost };
