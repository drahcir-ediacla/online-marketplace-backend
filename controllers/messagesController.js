const { Sequelize, Op } = require('sequelize');
const { sequelize, messagesModel, chatsModel } = require('../config/sequelizeConfig')


// --------------- CHECK IF CHAT EXISTS  --------------- //

// Backend API to check if chat exists
const checkChatId = async (req, res) => {
  try {
    const { sender_id, receiver_id, product_id } = req.query;

    const existingChat = await chatsModel.findOne({
      where: {
        participants: JSON.stringify([sender_id, receiver_id]),
        product_id: product_id,
      },
    });

    if (existingChat) {
      res.json({ chat_id: existingChat.chat_id });
    } else {
      res.json({ chat_id: null });
    }
  } catch (error) {
    console.error('Error checking chat:', error);
    res.status(500).json({ error: 'Failed to check chat.' });
  }
};


// --------------- GET CHAT BY ID  --------------- //
const getChatId = async (req, res) => {

  try {
    const { chat_id } = req.params;
    const chatID = await chatsModel.findOne({ where: { chat_id } });
    res.json(chatID);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve chat ID.' });
  }
};



// --------------- SEND AND CREATE NEW CHAT MESSAGES  --------------- //
// Create or retrieve chat ID based on sender and receiver
const getOrCreateChatId = async (sender_id, receiver_id, product_id) => {
  try {
    // Convert sender and receiver IDs to strings
    const senderId = sender_id.toString();
    const receiverId = receiver_id.toString();
    const productId = product_id.toString();

    // Normalize participant ordering
    const sortedParticipants = JSON.stringify([senderId, receiverId].sort());

    // Find chat where participants include both sender and receiver
    const existingChat = await chatsModel.findOne({
      where: {
        participants: sortedParticipants,
        product_id: productId,
      },
    });


    // const existingChat = await chatsModel.findOne({
    //   where: {
    //     participants: JSON.stringify([senderId, receiverId]),
    //     product_id: productId,
    //   },
    // });
    

     // Log existing chat for debugging
     console.log('Existing Chat:', existingChat);
     
    if (existingChat) {
      // If chat exists, return the existing chat_id
      return existingChat.chat_id;
    } else {
      // If chat does not exist, create a new chat
      const newChat = await chatsModel.create({
        participants: [senderId, receiverId], // Store as array in JSON format
        product_id: productId,
      });
      // Log new chat for debugging
      console.log('New Chat Created:', newChat);
      return newChat.chat_id;
    }
  } catch (error) {
    console.error('Error retrieving or creating chat:', error);
    throw new Error('Failed to get or create chat.');
  }
};



const createChatMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id, product_id, content } = req.body;

    // Store the message in the database regardless of the WebSocket condition
    const chatId = await getOrCreateChatId(sender_id, receiver_id, product_id);
    const message = await messagesModel.create({
      chat_id: chatId,
      sender_id,
      receiver_id,
      product_id,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Detailed Error:', error); // Log detailed error
    res.status(500).json({ error: 'Failed to create message.' });
  }
};




const getMessages = async (req, res) => {

  try {
    const { chat_id } = req.params;
    const messages = await messagesModel.findAll({ where: { chat_id } });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
};







module.exports = {
  checkChatId,
  getChatId,
  createChatMessages,
  getMessages
}