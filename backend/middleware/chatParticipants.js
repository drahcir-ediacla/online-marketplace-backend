const { participantModel } = require('../config/sequelizeConfig');

const isParticipant = async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized. Please login to continue.' });
    }

    const { chat_id } = req.params;
    const participants = await participantModel.findAll({ where: { chat_id, user_id: req.user?.id } });

    // Check if the authenticated user is one of the participants in any record with the given chat_id
    if (participants && participants.length > 0) {
      return next(); // User is a participant, proceed to the next middleware/route handler
    } else {
      return res.status(403).json({ error: 'Access denied. You are not a participant of this chat.' });
    }
  } catch (error) {
    console.error('Error checking participant:', error);
    return res.status(500).json({ error: 'Failed to check participant.' });
  }
};

module.exports = isParticipant;
