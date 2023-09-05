const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'https://yogeek.onrender.com')));

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'https://yogeek.onrender.com', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Enable CORS for all routes or specify origins accordingly
app.use(cors());