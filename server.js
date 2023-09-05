const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the specified directory
app.use(express.static(path.join('/opt/render/project/src/public')));

// Catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join('/opt/render/project/src/public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
