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
      if (err.name === 'TokenExpiredError') {
        console.error('JWT Token Expired:', err);
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: JWT token has expired. Please refresh your token.',
        });
      }

      console.error('JWT Verification Error:', err);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Invalid JWT token.',
      });
    }

    // Ensure req.user exists and assign decoded user info
    req.user = req.user || {};
    req.user.id = decoded.userId; // Consistent camelCase naming

    if (process.env.NODE_ENV !== 'production') {
      console.log('Decoded User:', decoded);
    }

    next();
  });
};

module.exports = verifyJWT;
