const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
require('./controllers/passportController');
const passport = require('passport');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes');
const passportRoutes = require('./routes/passportRoutes');
const refreshRoutes = require('./routes/refreshRoutes');
const sessionStore = require('./config/sessionsConfig');

const port = process.env.PORT || 8081;

// custom middleware logger
app.use(logger);

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { httpOnly: true, sameSite: 'none', secure: true, maxAge: 3600000 },
    proxy: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//Routes
app.use('/', otpRoutes);
app.use('/', authRoutes);
app.use('/auth', passportRoutes);
app.use('/', refreshRoutes);

// Middleware to set Cache-Control header
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

app.use(verifyJWT)
// Authenticated routes
app.use('/', userRoutes);

app.get('/', (req, res) => {
  return res.json('From Backend Side');
});

// Error handling middleware
app.use(errorHandler);

app.listen(port, () => console.log(`Listening on port ${port}`));
