const express = require('express');
const cors = require('cors');
require("./controllers/passportController");
const passport = require("passport")
const app = express();
app.use(express.json());
const session = require('express-session');
const bodyParser = require('body-parser');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const verifyJWT = require('./middleware/verifyJWT')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes')
const passportRoutes = require('./routes/passportRoutes')
const refreshRoutes = require('./routes/refreshRoutes')
const credentials = require('./middleware/credentials')
const sessionStore = require('./config/sessionsConfig')

const port = process.env.PORT || 8081;



// custom middleware logger
app.use(logger);

// Middleware to set the required header
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// Handle options credentials check - before CORS!
// and fetch cookies credentials requirement
app.use(credentials);

// Cross Origin Resource Sharing
app.use(cors({
  origin: ["https://yogeek.onrender.com"],
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));


app.use(bodyParser.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: false, maxAge: 3600000 },
  }));

app.use(passport.initialize());
app.use(passport.session());



// built-in middleware to handle urlencoded data
// in other words, form data:  
// ‘content-type: application/x-www-form-urlencoded’
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json 
app.use(express.json());

app.use(cookieParser());


//Routes
app.use('/', otpRoutes);
app.use('/', authRoutes);
app.use("/auth", passportRoutes);
app.use('/', refreshRoutes);

app.use(verifyJWT)
app.use('/', userRoutes);



app.get('/', (req, res) => {
    return res.json("From Backend Side");
});

app.use(errorHandler);

app.listen(port, () => console.log(`Listening on port ${port}`));

