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


  module.exports = {
    getForumNotificationsByUserId
  }