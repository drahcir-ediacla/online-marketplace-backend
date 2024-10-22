const { forumNotificationModel, userModel } = require('../config/sequelizeConfig')


const getForumNotificationsByUserId = async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication is required to fetch forum notifications.' })
      }
  
      const userId = req.user.id;
  
      const userNotifications = await forumNotificationModel.findAll({
        where: {
          recipient_id: userId,
        },
        include: [{
          model: userModel,
          as: 'subject_User', // Alias for the user model in the notification model
          attributes: ['profile_pic'], // Select the profile_pic attribute only
        }],
      })
  
      res.status(200).json(userNotifications)
    } catch (error) {
      console.error('Error fetching user forum notifications:', error);
      res.status(500).json({ error: 'An error occurred while fetching forum notifications.' });
    }
  }


  const deleteForumNotificationbyId = async (req, res) => {
    try {
  
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required to delete the notification.' });
      }
  
      const userId = req.user.id;
      const notificationId = req.params.id;
  
      // Use Sequelize to find the product by ID
      const notification = await forumNotificationModel.findOne({
        where: {
          id: notificationId,
          recipient_id: userId
        }
      })
  
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found or already deleted.' });
      }
  
      await notification.destroy();
  
      res.status(200).json({ message: 'Notification deleted successfully' });
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred while processing the request.' })
    }
  }


  module.exports = {
    getForumNotificationsByUserId,
    deleteForumNotificationbyId
  }