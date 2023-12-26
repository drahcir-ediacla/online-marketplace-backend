const db = require('../config/dbConfig');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshJWT) {
        return res.sendStatus(401); // Unauthorized
    }

    const refreshToken = cookies.refreshJWT;

    
    // Query the database to find the user associated with the refreshToken
    const getUserQuery = 'SELECT * FROM refresh_tokens WHERE token = ?';
    db.query(getUserQuery, [refreshToken], (getUserErr, user) => {
        if (getUserErr) {
            console.error('Error retrieving user:', getUserErr);
            return res.sendStatus(500); // Internal Server Error
        }

        if (!user || user.length === 0) {
            return res.sendStatus(403); // Forbidden
        }

        // Verify the refresh token
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err || user[0].user_id !== decoded.user_id) {
                    return res.sendStatus(403); // Forbidden
                }

                // Generate a new access token with a longer expiration time (e.g., hours)
                const accessToken = jwt.sign(
                    { user_id: decoded.user_id },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '10s' } // Adjust the expiration time as needed
                );

                // Set the new access token in the cookie
                res.cookie('jwt', accessToken, {
                    httpOnly: true,
                    // Add other cookie attributes as needed (e.g., domain, path, secure, etc.)
                });

                // Send the new access token in the response body if needed
                res.json({ accessToken });
            }
        );
    });
};

module.exports = { handleRefreshToken };
