const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const app = express();
app.use(express.json());
const { logger } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
// const bodyParser = require('body-parser');
const port = process.env.PORT || 8081;


// custom middleware logger
app.use(logger);

// Cross Origin Resource Sharing
app.use(cors());


// built-in middleware to handle urlencoded data
// in other words, form data:  
// ‘content-type: application/x-www-form-urlencoded’
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json 
app.use(express.json());

app.use('/', authRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    return res.json("From Backend Side");
});

app.use(errorHandler);

app.listen(port, () => console.log(`Listening on port ${port}`));

