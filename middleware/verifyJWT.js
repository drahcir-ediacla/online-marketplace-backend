const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"]; // Corrected way to extract headers in Express
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Access token missing' });
  }

  const token = authHeader.split(" ")[1]; // Extract token after "Bearer "
  console.log("Extracted Token:", token);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        console.error('Access Token Expired:', err);
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Access token has expired. Please refresh your token.',
        });
      }

      console.error('Access Token Verification Error:', err);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid JWT token.',
      });
    }

    req.user = req.user || {};
    req.user.id = decoded.userId;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Decoded User:', decoded);
    }

    next();
  });
};

module.exports = verifyJWT;
