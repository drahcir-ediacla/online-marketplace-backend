const socketIo = require('socket.io');
require('dotenv').config();

const configureSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL, // Update with your React app URL
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    // Join chat room based on chat_id
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);  // Join the room based on chat_id
    });

    // Handle sending messages to a specific chat room (chat_id)
    socket.on('send_message', (data) => {
      // Ensure data contains chat_id and message content
      if (data.chat_id && data.content) {
        // Emit message to the specific chat room (chat_id)
        io.to(data.chat_id).emit('receive_message', data);
      } else {
        // Handle error if chat_id or content is missing
        console.error('Invalid data received for sending message:', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

module.exports = configureSocket;
