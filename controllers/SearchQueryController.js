const { Sequelize } = require('sequelize');
const { sequelize, userModel, productModel, categoryModel, productImagesModel, wishListModel, productViewModel } = require('../config/sequelizeConfig')


// --------------- SEARCH ITEMS GLOBALLY  --------------- //
const searchProductsGlobally = async (req, res) => {
    try {
      const { name } = req.query;
  
      // Sequelize query to search for products based on name and category label
      const productDetails = await productModel.findAll({
        where: {
          product_name: {
            [Sequelize.Op.like]: `%${name}%`,
          },
        },
        include: [
          {
            model: userModel,
            attributes: ['city', 'region'],
            as: 'seller',
            where: { id: Sequelize.col('Product.seller_id') },
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
  
      res.status(200).json(productDetails);
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ error: 'An error occurred while searching products.' });
    }
  };


  module.exports = { searchProductsGlobally}  