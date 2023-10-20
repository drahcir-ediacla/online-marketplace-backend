const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Import the 'cookie' library
require('dotenv').config();

const verifyJWT = (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || ''); // Parse the cookies from the request headers
  const jwtCookie = cookies.jwt; // Get the 'jwt' cookie, which should contain the access token

  if (!jwtCookie) {
    return res.sendStatus(401); // No 'jwt' cookie, unauthorized
  }

  jwt.verify(
    jwtCookie,
    process.env.ACCESS_TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        return res.sendStatus(403); // Invalid token
      }
      req.user = decoded.user_id;
      next();
    }
  );
};

module.exports = verifyJWT;
