const { Sequelize, Op } = require('sequelize');
const { sequelize, messagesModel, chatsModel, participantModel, offersModel, reviewsModel, productModel, productImagesModel, userModel } = require('../config/sequelizeConfig');
const { response } = require('express');



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
      const authenticatedUserId = req.user.id;

      // Fetch existing chats for the authenticated user
      const existingChats = await participantModel.findAll({
        attributes: ['chat_id'],
        where: {
          user_id: authenticatedUserId,
          deleted: false,
        },
        include: [
          {
            model: chatsModel,
            attributes: ['product_id'],
            as: 'chat',
            include: [
              {
                model: productModel,
                attributes: ['id', 'product_name'],
                as: 'product',
                include: [
                  {
                    model: userModel,
                    attributes: ['id', 'display_name'],
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
                attributes: ['id', 'sender_id', 'receiver_id', 'content', 'read', 'archived', 'timestamp'],
                as: 'messages',
              },
            ],
          },
          {
            model: userModel,
            attributes: ['id', 'display_name', 'profile_pic'],
            as: 'authenticatedParticipant',
          },
        ],
      });

      if (existingChats.length === 0) {
        return res.status(200).json({ message: 'No chats found.' });
      }

      // Fetch chats for other participants with the same chat_id
      const otherParticipantsChats = await participantModel.findAll({
        where: {
          chat_id: {
            [Op.in]: existingChats.map(chat => chat.chat_id)
          },
          user_id: {
            [Op.ne]: authenticatedUserId
          }
        },
        include: [
          {
            model: userModel,
            attributes: ['id', 'display_name', 'profile_pic'],
            as: 'otherParticipant',
            where: {
              id: {
                [Op.ne]: authenticatedUserId
              },
            },
          },
        ],
      });

      const allChats = existingChats.map(chat => {
        const chatJSON = chat.toJSON();
        chatJSON.chat.product = chatJSON.chat.product[0]; // Extract the first product from the array
        const otherParticipantChat = otherParticipantsChats.find(oc => oc.chat_id === chat.chat_id);
        return {
          ...chatJSON,
          otherParticipant: otherParticipantChat ? otherParticipantChat.otherParticipant : null,
        }
      });

      // const allChats = existingChats.map(chat => {
      //   const chatJSON = chat.toJSON();
      //   chatJSON.chat.product = chatJSON.chat.product[0]; 
      //   const otherParticipantChat = otherParticipantsChats.find(oc => oc.chat_id === chat.chat_id);
      //   return {
      //     ...chat.toJSON(),
      //     otherParticipant: otherParticipantChat ? otherParticipantChat.otherParticipant : null,
      //   };
      // });

      res.status(200).json(allChats);
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
    const { sender_id } = req.params;
    const chatID = await chatsModel.findOne({
      where: {
        chat_id
      },
      include: [
        {
          model: offersModel,
          attributes: ['chat_id', 'buyer_id', 'seller_id', 'product_id', 'offer_price', 'offer_status'],
          as: 'offers',
        },
        {
          model: reviewsModel,
          attributes: ['review_id', 'reviewer_id'],
          as: 'review',
          where: {
            chat_id: chat_id,
            reviewer_id: sender_id,
          },
          required: false, // Set required to false to return even if reviewsModel doesn't have the chat ID
        }
      ]
    });

    if (!chatID) {
      return res.status(404).json({ error: 'Chat ID not found.' });
    }

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


    console.log('Product ID:', productId);



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
    const { sender_id, receiver_id, product_id, content, offer_price, offer_status } = req.body;

    // Store the message in the database regardless of the WebSocket condition
    const chatId = await createChatId(sender_id, receiver_id, product_id);

    let messageContent;
    if (offer_price) {
      messageContent = `<h6 style="color: #035956; font-weight: 600;">Offered Price</h6><span style="font-weight: 600;">${offer_price}</span>`;
    } else {
      messageContent = content;
    }


    let offerStatus;
    if (offer_price) {
      offerStatus = 'Pending';
    } else {
      offerStatus = 'None';
    }

    const message = await messagesModel.create({
      chat_id: chatId,
      sender_id,
      receiver_id,
      product_id,
      content: messageContent,
    });


    await offersModel.create({
      chat_id: chatId,
      buyer_id: sender_id,
      seller_id: receiver_id,
      product_id: product_id,
      offer_price: offer_price || null,
      offer_status: offerStatus,
    })


    // Store participants in the chat_participants table
    await participantModel.bulkCreate([
      { chat_id: chatId, user_id: sender_id, product_id: product_id },
      { chat_id: chatId, user_id: receiver_id, product_id: product_id },
    ]);

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




//-----------------------SEND OR CANCEL OFFER IN EXISTING CHAT  ----------------------------//


const handleOfferOptions = async (req, res) => {
  try {
    const { chat_id, sender_id, receiver_id, product_id, content, offer_price, offer_status } = req.body;

    let messageContent;
    if (offer_status === 'Pending') {
      messageContent = `<h6 style="color: #035956; font-weight: 500;">Offered Price</h6><span style="font-weight: 600;">${offer_price}</span>`;
    } else {
      if (offer_status === 'Cancelled') {
        messageContent = `<h6 style="color: red; font-weight: 500;">Offer Cancelled</h6><span style="font-weight: 600;">${content}</span>`;
      }
      else if (offer_status === 'Accepted') {
        messageContent = `<h6 style="color: green; font-weight: 500;">Offer Accepted</h6><span style="font-weight: 600;">${content}</span>`;
      }
      else if (offer_status === 'Declined') {
        messageContent = `<h6 style="color: red; font-weight: 500;">Offer Declined</h6><span style="font-weight: 600;">${content}</span>`;
      }
    }

    const transaction = await sequelize.transaction();

    try {
      const message = await messagesModel.create({
        chat_id,
        sender_id,
        receiver_id,
        product_id,
        content: messageContent,
      }, { transaction });

      const existingOffer = await offersModel.findOne({
        where: { chat_id }
      });

      if (!existingOffer) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Offer not found' });
      }

      await existingOffer.update({
        offer_price: offer_price || null,
        offer_status
      }, { transaction });

      await transaction.commit();

      res.status(201).json(message);
    } catch (error) {
      console.error('Detailed Error:', error);
      await transaction.rollback();
      res.status(500).json({ error: 'Failed to create message.' });
    }
  } catch (error) {
    console.error('Top-level Error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};




//----------------------- ACCEPT OR DECLINE OFFER IN EXISTING CHAT  ----------------------------//


const acceptOrDeclineOffer = async (req, res) => {
  try {
    const { chat_id, sender_id, receiver_id, product_id, content, offer_price, offer_status } = req.body;

    let messageContent;
    if (offer_price) {
      messageContent = `<h6 style="color: #035956; font-weight: 600;">Offer Accepted</h6><span style="font-weight: 600;">${offer_price}</span>`;
    } else {
      messageContent = `<h6 style="color: red; font-weight: 500;">Offer Declined</h6><span style="font-weight: 600;">${content}</span>`;
    }

    // Use Sequelize transaction to ensure data integrity
    const transaction = await sequelize.transaction();

    // Store the message in the database regardless of the WebSocket condition
    // const chatId = await useChatId(sender_id, receiver_id, product_id);
    const message = await messagesModel.create({
      chat_id,
      sender_id,
      receiver_id,
      product_id,
      content: messageContent,
    }, { transaction });


    const existingOffer = await offersModel.findOne({
      where: {
        chat_id,
      },
    });


    if (!existingOffer) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Offer not found' });
    }


    await existingOffer.update({
      offer_price: offer_price || null,
      offer_status,
    }, { transaction })

    await transaction.commit();

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



const getUnreadMessages = async (req, res) => {
  try {

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to get unread messages.' })
    }

    const userId = req.user.id

    const unreadMessages = await messagesModel.findAll({
      where: {
        receiver_id: userId,
        read: 0,
      }
    })

    res.status(200).json(unreadMessages)

  } catch (error) {
    console.error('Error fetching user unread messages:', error);
    res.status(500).json({ error: 'An error occurred while fetching unread messages.' });
  }
}


const readMessageByChatId = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to mark notifications as read.' })
    }

    const userId = req.user.id;
    const { chat_id } = req.params;

    const userUnreadMessage = await messagesModel.findAll({
      where: {
        chat_id,
        receiver_id: userId,
      }
    })

    if (!userUnreadMessage || userUnreadMessage.length === 0) {
      return res.status(404).json({ error: 'Chat message not found' });
    }

    // Update all message by chat ID to mark it as read
    for (const message of userUnreadMessage)
      await message.update({ read: true });

    // Return a success message
    res.status(200).json({ message: 'Chat message marked as read successfully.' });

  } catch (error) {
    console.error('Error marking chat message as read:', error);
    res.status(500).json({ error: 'An error occurred while marking chat message as read.' });
  }
}



const archiveChat = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to archive chat.' });
    }

    const userId = req.user.id;
    const { chat_id } = req.params;

    const chatMessages = await messagesModel.findAll({
      where: {
        chat_id,
        receiver_id: userId,
      }
    });

    if (!chatMessages || chatMessages.length === 0) {
      return res.status(404).json({ error: 'Chat message not found' });
    }

    // Check the current archived status of the first message
    const currentArchivedStatus = chatMessages[0].archived;

    // Toggle the archived status for all messages by chat ID
    for (const message of chatMessages) {
      await message.update({ archived: !currentArchivedStatus });
    }

    // Return a success message with the new archived status
    res.status(200).json({
      message: `Chat messages ${currentArchivedStatus ? 'unarchived' : 'archived'} successfully.`,
      newArchivedStatus: !currentArchivedStatus
    });
  } catch (error) {
    console.error('Error toggling archive status:', error);
    res.status(500).json({ error: 'An error occurred while toggling archive status of chat messages.' });
  }
};




const deleteChatById = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to delete chat.' });
    }

    const authenticatedUserId = req.user.id;
    const { chat_id } = req.params;

    // Verify the authenticated user is a participant in the chat
    const chatAuthUserParticipant = await participantModel.findOne({
      where: {
        chat_id,
        user_id: authenticatedUserId,
      }
    });

    if (!chatAuthUserParticipant) {
      return res.status(404).json({ error: 'Chat not found or user not authorized to delete chat.' });
    }

    // Mark the chat as deleted for the authenticated user
    await participantModel.update(
      { deleted: true },
      { where: { chat_id, user_id: authenticatedUserId } }
    );

    res.status(200).json({ message: 'Chat successfully marked as deleted for the user.' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'An error occurred while deleting the chat.' });
  }
};




module.exports = {
  checkChatId,
  getChatId,
  getAllUserChat,
  createChatMessages,
  sendChatMessages,
  handleOfferOptions,
  acceptOrDeclineOffer,
  getMessages,
  getAllChat,
  getUnreadMessages,
  readMessageByChatId,
  archiveChat,
  deleteChatById
}