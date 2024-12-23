const corsOptions = {
  origin: ["http://localhost:3000", "https://yogeek.onrender.com", "http://localhost:8081", "https://yogeek-server.onrender.com", "https://cytv125.com"], // Specify the exact origin of your frontend
  methods: 'GET,POST,PUT,DELETE',
  credentials: true, // Allow credentials (cookies)
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Private-Network', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Credentials', 'Access-Control-Allow-Origin'],
};

module.exports = corsOptions;
