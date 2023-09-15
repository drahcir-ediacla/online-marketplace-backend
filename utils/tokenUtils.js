const jwt = require('jsonwebtoken');
require('dotenv').config();

// Secret keys for signing tokens (you can use different keys)
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

// Generate an access token
const generateAccessToken = (user_id) => {
  const payload = {
    user_id,
  };
  const options = {
    expiresIn: '30s', // Token expires in 1 hour
  };
  return jwt.sign(payload, accessTokenSecret, options);
};

// Generate a refresh token
const generateRefreshToken = (user_id) => {
  const payload = {
    user_id,
  };
  const options = {
    expiresIn: '7d', // Token expires in 7 days (adjust as needed)
  };
  return jwt.sign(payload, refreshTokenSecret, options);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  accessTokenSecret,
  refreshTokenSecret,
};
