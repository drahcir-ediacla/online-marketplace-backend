const { notificationModel, userModel } = require('../config/sequelizeConfig')


const getNotificationsByUserId = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to fetch notifications.' })
    }

    const userId = req.user.id;

    const userNotifications = await notificationModel.findAll({
      where: {
        recipient_id: userId,
      },
      include: [{
        model: userModel,
        as: 'subjectUser', // Alias for the user model in the notification model
        attributes: ['profile_pic'], // Select the profile_pic attribute only
      }],
    })

    res.status(200).json(userNotifications)
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching notifications.' });
  }
}



const getUnreadNotifications = async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to get unread notifications.' });
    }

    const userId = req.user.id;

    const unreadNotifications = await notificationModel.findAll({
      where: {
        recipient_id: userId,
        read: 0,
      },
      include: [{
        model: userModel,
        as: 'subjectUser', // Alias for the user model in the notification model
        attributes: ['profile_pic'], // Select the profile_pic attribute only
      }],
    })

    res.status(200).json(unreadNotifications)

  } catch (error) {
    console.error('Error fetching user unread notifications:', error);
    res.status(500).json({ error: 'An error occurred while fetching unread notifications.' });
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


const readAllNotification = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication is required to mark notifications as read.' })
    }

    const userId = req.user.id;

    const notifications = await notificationModel.findAll({
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




const deleteNotificationbyId = async (req, res) => {
  try {

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required to delete the notification.' });
    }

    const userId = req.user.id;
    const notificationId = req.params.id;

    // Use Sequelize to find the product by ID
    const notification = await notificationModel.findOne({
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


const deleteAllNotifications = async (req, res) => {
try {
  if (!req.isAuthenticated()) {
    return res.status(401).json ({error: 'Authentication required to delete the all notifications.'})
  }

  const userId = req.user.id;

  const notifications = await notificationModel.findAll({
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
  res.status(500).json({error: 'An error occurred while deleting all notifications.'})
}
}



module.exports = {
  getNotificationsByUserId,
  readNotification,
  readAllNotification,
  getUnreadNotifications,
  deleteNotificationbyId,
  deleteAllNotifications
}