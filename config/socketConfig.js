const socketIo = require('socket.io');
require('dotenv').config();
const { userModel } = require('../config/sequelizeConfig')




const configureSocket = (server, req) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL, // Update with your React app URL
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Assuming user authentication is done and user ID is available
    const userId = socket.handshake.query.id;
    console.log('userId:', userId)


    if (userId) {
      // Update user status to 'online'
      userModel.upsert({ id: userId, status: 'online' }).then(() => {
        // Broadcast user status change
        io.emit('updateUserStatus', { id: userId, status: 'online' });
      }).catch((err) => console.error('Error updating user status:', err));
    }

    // Join chat room based on chat_id
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);  // Join the room based on chat_id
      io.emit('updateChats');
    });

    // Handle sending messages to a specific chat room (chat_id)
    socket.on('send_message', (data) => {
      // Ensure data contains chat_id and message content
      if (data.chat_id && data.content) {
        // Emit message to the specific chat room (chat_id)
        io.to(data.chat_id).emit('receive_message', data);
        io.emit('updateChats');
      } else {
        // Handle error if chat_id or content is missing
        console.error('Invalid data received for sending message:', data);
      }
    });
    

    socket.on('disconnect', () => {
      console.log('Client disconnected');
       if (userId) {
        // Update user status to 'offline'
        userModel.upsert({ id: userId, status: 'offline' }).then(() => {
          // Broadcast user status change
          io.emit('updateUserStatus', { id: userId, status: 'offline' });
        }).catch((err) => console.error('Error updating user status:', err));
      }
    });
  });

  return io;
};

module.exports = configureSocket;
