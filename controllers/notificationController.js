const { notificationModel } = require('../config/sequelizeConfig')


const getNotificationsById = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication is required to view notifications.' })
        }

        const userId = req.user.id;

        const userNotifications = await notificationModel.findAll({
            where: {
                recipient_id: userId,
            }
        })

        res.status(200).json(userNotifications)
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ error: 'An error occurred while fetching notifications.' });
    }
}

module.exports = {getNotificationsById}