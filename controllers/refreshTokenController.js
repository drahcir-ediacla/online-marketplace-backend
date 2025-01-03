const { refreshTokenModel } = require('../config/sequelizeConfig');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshJWT) {
        return res.sendStatus(401); // Unauthorized
    }

    const refreshToken = cookies.refreshJWT;

    try {
        // Query the database to find the user associated with the refreshToken
        const user = await refreshTokenModel.findOne({
            where: { token: refreshToken },
        });

        if (!user) {
            return res.status(403).json({ message: 'Refresh token not found' }); // Forbidden
        }

        // Verify the refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err || user.userId !== decoded.userId) {
                return res.sendStatus(403); // Forbidden
            }

            // Generate a new access token
            const accessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' } // Adjust the expiration time as needed
            );

            // Generate a new refresh token (optional)
            // const newRefreshToken = jwt.sign(
            //     { userId: decoded.userId },
            //     process.env.REFRESH_TOKEN_SECRET,
            //     { expiresIn: '1d' } // Adjust expiration for refresh token
            // );

            // Update refresh token in the database
            // user.token = newRefreshToken;
            // await user.save();


            // Set the new access token in the cookie
            res.cookie('jwt', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use Secure flag in production
                sameSite: 'none', 
                maxAge: 15 * 60 * 1000, // 15 mins
                path: '/'
            });

            // res.cookie('refreshJWT', newRefreshToken, {
            //     httpOnly: true,
            //     // secure: process.env.NODE_ENV === 'production', // Use Secure flag in production
            //     // sameSite: 'none', 
            //     maxAge:  24 * 60 * 60 * 1000, // 7 days
            //     path: '/'
            // });

            // Send the new access token in the response body if needed
            res.json({ accessToken });
        });
    } catch (error) {
        console.error('Error handling refresh token:', error);
        res.sendStatus(500); // Internal Server Error
    }
};

module.exports = { handleRefreshToken };
