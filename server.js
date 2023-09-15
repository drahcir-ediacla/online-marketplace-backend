const express = require('express');
const cors = require('cors');
require("./config/passportConfig");
const passport = require("passport")
const corsOptions = require('./config/corsOptions');
const app = express();
app.use(express.json());
const bodyParser = require('body-parser');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
// const registerRoutes = require('./routes/registerRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes')
const passportRoutes = require('./routes/passportRoutes')
const refreshRoutes = require('./routes/refreshRoutes')
const verifyJWT = require('./middleware/verifyJWT')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 8081;



// custom middleware logger
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors());



app.use(bodyParser.json());

app.use(passport.initialize());


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

