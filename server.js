const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
require('./controllers/passportController');
const passport = require('passport');
const configureSocket = require('./config/socketConfig')
const app = express();
const http = require('http');
const server = http.createServer(app); // Create HTTP server
const session = require('express-session');
const bodyParser = require('body-parser');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const passportRoutes = require('./routes/passportRoutes');
const refreshRoutes = require('./routes/refreshRoutes');
const searchRoutes = require('./routes/searchRoutes')
const messageRoutes = require('./routes/messagesRoutes')
const imagesRoutes = require('./routes/imagesRoutes')
const sessionStore = require('./config/sessionsConfig');
const followerRoutes = require('./routes/followerRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const notificationRoutes = require('./routes/notificationRoutes');
const forumRoutes = require('./routes/forumRoutes');
const forumNotificationRoutes = require('./routes/forumNotificationRoutes');
const testRoutes = require('./routes/testRoutes');

const port = process.env.PORT || 8081;


// custom middleware logger
app.use(logger);

app.use(cors(corsOptions));

// Increase the body size limit to 10MB
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { httpOnly: true, sameSite: 'none', secure: true, maxAge: 86400000 },
    proxy: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Initialize Socket.io
const io = configureSocket(server); // Pass the server instance to configureSocket function

// Middleware to use Socket.io
app.use((req, res, next) => {
  req.io = io; // Attach io instance to the request object
  next();
});

//Routes
app.use('/', authRoutes);
app.use('/auth', passportRoutes);
app.use('/', refreshRoutes);
app.use('/', productRoutes);
app.use('/', userRoutes);
app.use('/', searchRoutes);
app.use('/', messageRoutes);
app.use('/', imagesRoutes);
app.use('/', followerRoutes);
app.use('/', reviewRoutes);
app.use('/', notificationRoutes);
app.use('/', forumRoutes);
app.use('/', forumNotificationRoutes);
// Middleware to set Cache-Control header
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use(verifyJWT)
// Authenticated routes
app.use('/verify', userRoutes);
app.use('/', testRoutes);

app.get('/', (req, res) => {
  return res.json('From Backend Side');
});

// Error handling middleware
app.use(errorHandler);

server.listen(port, () => console.log(`Listening on port ${port}`));
