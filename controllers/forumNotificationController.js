const { forumNotificationModel, userModel, forumActivityModel } = require('../config/sequelizeConfig')

const getForumActivitiesByUserId = async (req, res) => {
  try {

    const userId = req.params.id;

    // Validate userId here if necessary
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    const userActivities = await forumActivityModel.findAll({
      where: {
        subject_user_id: userId,
      },
      include: [{
        model: userModel,
        as: 'SubjectUser', // Alias for the user model in the notification model
        attributes: ['profile_pic', 'display_name'], // Select the profile_pic attribute only
      }],
    })

    res.status(200).json(userActivities || [])
  } catch (error) {
    console.error('Error fetching user forum activities:', error);
    res.status(500).json({ error: 'An error occurred while fetching forum activities.' });
  }
}

const getForumNotificationsByUserId = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to fetch forum notifications.' })
    }

    const userId = req.user.id;

    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    // Calculate the offset
    const offset = (page - 1) * limit;

    const userNotifications = await forumNotificationModel.findAll({
      where: {
        recipient_id: userId,
      },
      include: [{
        model: userModel,
        as: 'subject_User', // Alias for the user model in the notification model
        attributes: ['profile_pic'], // Select the profile_pic attribute only
      }],
      limit,
      offset,
    })

    const sortedNotifications = [...userNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.status(200).json(sortedNotifications)
  } catch (error) {
    console.error('Error fetching user forum notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching forum notifications.' });
  }
}

// Fetch total discussions count for pagination
const fetchTotalNotifications = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to fetch forum notifications.' })
    }

    const userId = req.user.id;
    const totalCount = await forumNotificationModel.count({
      where: { 
        recipient_id: userId,
        read: 0, 
      },
    });

    return res.status(200).json({ totalCount });
  } catch (error) {
    console.error('Error fetching user forum notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching forum notifications.' });
  }
};


const markReadNotification = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to mark notifications as read.' });
    }

    const userId = req.user.id;
    const notificationId = req.params.notificationId;

    // Find the notification by ID and ensure it belongs to the authenticated user
    const userNotification = await forumNotificationModel.findOne({
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


const markReadAllNotifications = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to mark notifications as read.' })
    }

    const userId = req.user.id;

    const notifications = await forumNotificationModel.findAll({
      where: {
        recipient_id: userId
      }
    })

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ error: 'No Notifications found' });
    }

    // Update all notification to mark it as read
    for (const notification of notifications) {
      await notification.update({ read: true });
    }

    res.status(200).json({ message: 'All notification marked as read successfully.' })
  } catch (error) {
    console.error('Error marking all notification as read:', error);
    res.status(500).json({ error: 'An error occurred while marking all notifications as read.' })
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

const deleteAllForumNotifications = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required to delete the all notifications.' })
    }

    const userId = req.user.id;

    const notifications = await forumNotificationModel.findAll({
      where: {
        recipient_id: userId
      }
    })

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ error: 'No Notifications found' });
    }

    // Delete all notifications to mark it as read
    for (const notification of notifications) {
      await notification.destroy();
    }

    res.status(200).json({ message: 'All notifications has been successfully deleted.' })

  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'An error occurred while deleting all notifications.' })
  }
}


module.exports = {
  getForumActivitiesByUserId,
  getForumNotificationsByUserId,
  fetchTotalNotifications,
  markReadNotification,
  markReadAllNotifications,
  deleteForumNotificationbyId,
  deleteAllForumNotifications
}