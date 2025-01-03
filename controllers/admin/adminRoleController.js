const { userRoleModel, rolesModel } = require('../../config/sequelizeConfig')


const getUserRole = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user?.id

    try {
        // Fetch the user's role from the database
        const userRole = await userRoleModel.findOne({ where: { user_id: userId } });
        if (!userRole) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const role = await rolesModel.findOne({ where: { id: userRole.role_id } });
        if (!role) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json(role);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
}


module.exports = { getUserRole }