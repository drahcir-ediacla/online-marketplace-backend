const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const app = express();
app.use(express.json());
const bodyParser = require('body-parser');
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const registerRoutes = require('./routes/registerRoutes');
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes')
const port = process.env.PORT || 8081;


// custom middleware logger
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors());

app.use(bodyParser.json());


// built-in middleware to handle urlencoded data
// in other words, form data:  
// ‘content-type: application/x-www-form-urlencoded’
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json 
app.use(express.json());

app.use('/', registerRoutes);
app.use('/', userRoutes);
app.use('/', otpRoutes);

app.get('/', (req, res) => {
    return res.json("From Backend Side");
});

app.use(errorHandler);

app.listen(port, () => console.log(`Listening on port ${port}`));

