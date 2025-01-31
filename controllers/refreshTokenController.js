const { refreshTokenModel } = require('../config/sequelizeConfig');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshJWT) {
        return res.sendStatus(401); // Unauthorized
    }

    const refreshToken = cookies.refreshJWT;
    const existingAccessToken = cookies.jwt;

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


            if (existingAccessToken) {
                try {
                    jwt.verify(existingAccessToken, process.env.ACCESS_TOKEN_SECRET);
                    return res.json({ accessToken: existingAccessToken }); // Return existing valid token
                } catch (accessErr) {
                    if (accessErr.name !== 'TokenExpiredError') {
                        return res.sendStatus(403); // Forbidden if invalid for other reasons
                    }
                }
            }

            // Generate a new access token since the existing one is expired or not provided
            const newAccessToken = jwt.sign(
                { userId: decoded.userId },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' } // Adjust the expiration time as needed
            );

            res.cookie('jwt', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Use Secure flag in production
                sameSite: 'none',
                maxAge: 15 * 60 * 1000, // 15 mins
                path: '/'
            });

            // Generate a new refresh token (optional)
            // const newRefreshToken = jwt.sign(
            //     { userId: decoded.userId },
            //     process.env.REFRESH_TOKEN_SECRET,
            //     { expiresIn: '1d' } // Adjust expiration for refresh token
            // );

            // Update refresh token in the database
            // user.token = newRefreshToken;
            // await user.save();

            // res.cookie('refreshJWT', newRefreshToken, {
            //     httpOnly: true,
            //     // secure: process.env.NODE_ENV === 'production', // Use Secure flag in production
            //     // sameSite: 'none', 
            //     maxAge:  24 * 60 * 60 * 1000, // 7 days
            //     path: '/'
            // });

            // Send the new access token in the response body if needed
            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        console.error('Error handling refresh token:', error);
        res.sendStatus(500); // Internal Server Error
    }
};

module.exports = { handleRefreshToken };
