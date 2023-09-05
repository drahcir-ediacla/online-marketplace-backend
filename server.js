const express = require('express');
const path = require('path');
const app = express();

// Serve the frontend build files
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle other API routes in the backend
app.get('/api/someRoute', (req, res) => {
  // Handle API logic here
});

// Always serve the main index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
