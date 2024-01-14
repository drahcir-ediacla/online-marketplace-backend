const { Sequelize, Op } = require('sequelize');
const { sequelize, messagesModel, chatsModel, productModel, productImagesModel, userModel } = require('../config/sequelizeConfig')



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



const getAllUserChat = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required to get chat messages.' });
    } else {
      const userId = req.user.id;

      const existingChat = await chatsModel.findAll({
        attributes: ['chat_id', 'participants', 'product_id'],
        where: {
          // Assuming participants is stored as a comma-separated string
          participants: {
            [Op.like]: `%${userId}%` // Using Sequelize's like operator to find chats where participants contain userId
          }
        },
        include: [
          {
            model: productModel,
            attributes: ['id', 'product_name'],
            as: 'product',
            include: [
              {
                model: userModel,
                attributes: ['display_name'],
                as: 'seller',
              },
              {
                model: productImagesModel,
                attributes: ['id', 'image_url'],
                as: 'images',
              },
            ],
          },
          {
            model: messagesModel,
            attributes: ['sender_id', 'receiver_id', 'content'],
            as: 'messages'
          }
        ]
      });

res.status(200).json(existingChat);
    }
  } catch (error) {
  console.error('Error fetching chat messages:', error);
  res.status(500).json({ error: 'An error occurred while fetching chats.' });
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


// --------------- CREATE NEW CHAT MESSAGES  --------------- //
// Create or retrieve chat ID based on sender and receiver
const createChatId = async (sender_id, receiver_id, product_id) => {
  try {
    // Convert sender and receiver IDs to strings
    const senderId = sender_id.toString();
    const receiverId = receiver_id.toString();
    const productId = product_id;

    // Normalize participant ordering
    const sortedParticipants = JSON.stringify([senderId, receiverId].sort());

    // Find chat where participants include both sender, receiver and product
    const existingChat = await chatsModel.findOne({
      where: {
        participants: sortedParticipants,
        product_id: productId,
      },
    });

    console.log('Sender ID:', senderId);
    console.log('Receiver ID:', receiverId);
    console.log('Product ID:', productId);
    console.log('Sorted Participants:', sortedParticipants);


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
    const chatId = await createChatId(sender_id, receiver_id, product_id);
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



//-----------------------SEND MESSAGE TO EXISTING CHAT  ----------------------------//


const sendChatMessages = async (req, res) => {
  try {
    const { chat_id, sender_id, receiver_id, product_id, content } = req.body;

    // Store the message in the database regardless of the WebSocket condition
    // const chatId = await useChatId(sender_id, receiver_id, product_id);
    const message = await messagesModel.create({
      chat_id,
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


const getAllChat = async (req, res) => {

  try {
    const chats = await chatsModel.findAll();
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
};







module.exports = {
  checkChatId,
  getChatId,
  getAllUserChat,
  createChatMessages,
  sendChatMessages,
  getMessages,
  getAllChat
}