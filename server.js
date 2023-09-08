const express = require('express');
const cors = require('cors');
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
const whitelist = ['https://yogeek.onrender.com', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8081'];
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));


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

