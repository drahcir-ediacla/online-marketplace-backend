const { notificationModel } = require('../config/sequelizeConfig')


const getNotificationsByUserId = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication is required to fetch notifications.' })
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



const readNotification = async (req, res) => {
    try {
        // Check if the user is authenticated
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: 'Authentication is required to mark notifications as read.' });
        }
    
        const userId = req.user.id;
        const notificationId = req.params.notificationId;
    
        // Find the notification by ID and ensure it belongs to the authenticated user
        const userNotification = await notificationModel.findOne({
          where: {
            id: notificationId,
            recipient_id: userId,
          },
        });
    
        // If the notification doesn't exist or doesn't belong to the user, return 404
        if (!userNotification) {
          return res.status(404).json({ error: 'Notification not found.' });
        }
    
        // Update the 'read' status of the notification
        await userNotification.update({ read: true });
    
        // Return a success message
        res.status(200).json({ message: 'Notification marked as read successfully.' });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'An error occurred while marking notification as read.' });
      }
}

module.exports = {getNotificationsByUserId, readNotification}