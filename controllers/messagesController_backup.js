const { Sequelize, Op } = require('sequelize');
const { sequelize, messagesModel } = require('../config/sequelizeConfig')


// --------------- CREATE CHAT MESSAGES  --------------- //
const createMessages = async (req, res) => {
    const { sender, receiver, message } = req.body;
    console.log('Request Body:', req.body);

    try {
        // Validate input data (if necessary)
        if (!sender || !receiver || !message) {
            console.log('Validation failed: Sender, receiver, and message are required fields.');
            return res.status(400).send({ error: 'Sender, receiver, and message are required fields.' });
        }

        // Create a new message using the Sequelize model
        const newMessage = await messagesModel.create({
            sender,
            receiver,
            message
        });

        // Log success message and send a successful response with the newly created message
        console.log('Message created successfully:', newMessage);
        // Send a successful response with the newly created message
        res.status(201).send(newMessage);
        
    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error creating message:', error);

        
        // Check the type of error and send an appropriate error response
        if (error instanceof Sequelize.ValidationError) {
            
            console.log('Validation error:', error.errors);
            // Handle Sequelize validation errors (e.g., missing required fields)
            return res.status(400).send({ error: 'Validation error', details: error.errors });
        } else if (error instanceof Sequelize.UniqueConstraintError) {

            console.log('Unique constraint error:', error.errors);
            // Handle Sequelize unique constraint errors (e.g., duplicate entries)
            return res.status(400).send({ error: 'Unique constraint error', details: error.errors });
        } else {

            console.log('Internal server error:', error.message);
            // Handle other types of errors
            return res.status(500).send({ error: 'Internal server error', message: error.message });
        }
    }
};



const getMessages = async (req, res) => {
    const sender = req.user?.id;
    const receiver = req.query.receiverId; // Assuming receiverId is passed as a query parameter
  
  
    try {
      const messages = await messagesModel.findAll({
        where: {
          [Op.or]: [
            { sender, receiver },
            { sender: receiver, receiver: sender }
          ]
        },
        order: [['createdAt', 'ASC']]
      });
  
      // Log the fetched messages for debugging
      console.log('Fetched Messages:', messages);
  
      res.send(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).send(error.message);
    }
  };
  


module.exports = {
    createMessages,
    getMessages
}