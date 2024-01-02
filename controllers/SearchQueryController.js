const { Sequelize } = require('sequelize');
const { sequelize, userModel, productModel, categoryModel, productImagesModel, wishListModel, productViewModel } = require('../config/sequelizeConfig')


// --------------- SEARCH ITEMS GLOBALLY  --------------- //
const searchProductsGlobally = async (req, res) => {
  try {
    const { keyword, location } = req.query;

    // Replace 'All of the Philippines' with 'Philippines'
    const cleanedLocation = location.replace('All of the Philippines', 'Philippines');

    // Split the cleaned location into an array
    const locationsArray = cleanedLocation.split(' | ').map(loc => loc.trim());

    console.log("Location:", locationsArray);

    // ... rest of your code remains the same ...


    const products = await productModel.findAll({
      where: {
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
            '$category.label$': {  // Include category in the search
              [Sequelize.Op.like]: `%${keyword}%`,
            },
          },
        ],
      },
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
          where: {
            [Sequelize.Op.or]: [
              { city: { [Sequelize.Op.in]: locationsArray } },  // Use Op.in for multiple city matching
              { region: locationsArray },
              { country: locationsArray },
            ],
          },
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
    });

    // Format the products as per the desired JSON structure
    const formattedProducts = products.map(product => ({
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




module.exports = { searchProductsGlobally }  