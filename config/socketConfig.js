const socketIo = require('socket.io');
require('dotenv').config()

const configureSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL, // Update with your React app URL
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('send_message', (data) => {
      io.emit('receive_message', data); // Broadcast message to all connected clients
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return io;
};

module.exports = configureSocket;
