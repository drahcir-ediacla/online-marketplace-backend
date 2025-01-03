const { rolesModel, userRoleModel } = require('../config/sequelizeConfig'); // Import your models

const verifyRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id; // Assuming req.user is populated with the logged-in user's data
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Fetch the user's role from the database
      const userRole = await userRoleModel.findOne({ where: { user_id: userId } });
      if (!userRole) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const role = await rolesModel.findOne({ where: { id: userRole.role_id } });
      if (!role || role?.role !== requiredRole) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Role matches, proceed to next middleware or route handler
      next();
    } catch (error) {
      console.error('Error checking user role:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
};

module.exports = verifyRole;
