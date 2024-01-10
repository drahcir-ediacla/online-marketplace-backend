const { Sequelize, Op } = require('sequelize');
const { sequelize, messagesModel, chatsModel } = require('../config/sequelizeConfig')


// --------------- SEND AND CREATE NEW CHAT MESSAGES  --------------- //
// Create or retrieve chat ID based on sender and receiver
const getOrCreateChatId = async (sender_id, receiver_id) => {
  try {
    // Convert sender and receiver IDs to strings
    const senderId = sender_id.toString();
    const receiverId = receiver_id;

    // Normalize participant ordering
    const sortedParticipants = JSON.stringify([senderId, receiverId].sort());

    // Find chat where participants include both sender and receiver
    const existingChat = await chatsModel.findOne({
      where: {
        participants: sortedParticipants,
      },
    });

    if (existingChat) {
      // If chat exists, return the existing chat_id
      return existingChat.chat_id;
    } else {
      // If chat does not exist, create a new chat
      const newChat = await chatsModel.create({
        participants: [senderId, receiverId], // Store as array in JSON format
      });
      return newChat.chat_id;
    }
  } catch (error) {
    console.error('Error retrieving or creating chat:', error);
    throw new Error('Failed to get or create chat.');
  }
};



const createChatMessages = async (req, res) => {
  try {
    const { sender_id, receiver_id, content } = req.body;

    // Get or create chat ID for sender and receiver
    const chatId = await getOrCreateChatId(sender_id, receiver_id);

    // Create new message with associated chat ID
    const message = await messagesModel.create({
      chat_id: chatId,
      sender_id,
      receiver_id,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
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
  createChatMessages,
  getMessages
}