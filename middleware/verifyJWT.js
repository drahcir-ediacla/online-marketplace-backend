const jwt = require('jsonwebtoken');
const cookie = require('cookie');
require('dotenv').config();

const verifyJWT = (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || '');
  const jwtCookie = cookies.jwt;

  if (!jwtCookie) {
    return res.status(401).json({ success: false, message: 'Unauthorized: JWT token missing' });
  }

  jwt.verify(jwtCookie, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.status(403).json({ success: false, message: 'Forbidden: Invalid JWT token' });
    }

    // Attach the user's ID to req.user for use in other middleware or routes.
    req.user = decoded.user_id;

    // Log the decoded user ID for debugging
    console.log('Decoded User ID:', decoded.user_id);

    next();
  });
};

module.exports = verifyJWT;
