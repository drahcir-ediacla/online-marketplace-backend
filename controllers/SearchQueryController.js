const { Sequelize } = require('sequelize');
const geolib = require('geolib');
const { sequelize, userModel, productModel, categoryModel, productImagesModel, wishListModel, productViewModel, listedLocationsModel } = require('../config/sequelizeConfig');

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
    console.log('Query parameters:', req.query);
    console.log('latitude:', latitude)
    console.log('longitude:', longitude)
    console.log('radius:', radius)

    // Initialize location filter based on provided location
    let locationFilter = {};

    if (location === 'Listing Near Me' && latitude && longitude && radius) {
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
          model: listedLocationsModel,
          attributes: ['product_id', 'latitude', 'longitude'],
          as: 'location',
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


    console.log('Initial products:', products.length);

    // Filter products by distance if latitude and longitude are provided
    let filteredProducts = products;
    if (latitude && longitude && radius) {
      const userLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      filteredProducts = products.filter(product => {
        if (!product.location) return false; // Skip products without location
        const productLocation = { latitude: product.location.latitude, longitude: product.location.longitude };
        const distance = geolib.getDistance(userLocation, productLocation);
        console.log(`Product ID ${product.id} distance:`, distance);
        return distance <= radius * 1000; // radius in kilometers
      });
    }

    console.log('Filtered products:', filteredProducts.length);



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
      listedIn: product.location ? {
        product_id: product.location.product_id,
        latitude: product.location.latitude,
        longitude: product.location.longitude
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
    console.log('formattedProducts:', formattedProducts)
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

module.exports = { searchProducts };
