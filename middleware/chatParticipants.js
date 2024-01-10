

const {chatsModel} = require('../config/sequelizeConfig')

const isParticipant = async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized. Please login to continue.' });
      }
  
      const { chat_id } = req.params;
      const chat = await chatsModel.findOne({ where: { chat_id } });
  
      // Check if the authenticated user is one of the participants
      if (chat && chat.participants.includes(req.user?.id.toString())) {
        return next(); // User is a participant, proceed to the next middleware/route handler
      } else {
        return res.status(403).json({ error: 'Access denied. You are not a participant of this chat.' });
      }
    } catch (error) {
      console.error('Error checking participant:', error);
      return res.status(500).json({ error: 'Failed to check participant.' });
    }
  };
  


  module.exports = isParticipant