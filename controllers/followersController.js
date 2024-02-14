const { Sequelize } = require('sequelize');
const { sequelize, followersModel } = require('../config/sequelizeConfig')



const followUser = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to follow user.' });
        }

        const followerId = req.user.id
        const followingId = req.params.id || req.body.id;

        await followersModel.create({
            follower_id: followerId,
            following_id: followingId,
        });

        res.status(200).json({ message: 'User followed successfully' });

    } catch (error) {
        console.error('Error following user:', error);
        res.status(500).json({ error: 'Unable to follow user' });
    }
}



const unfollowUser = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to unfollow user.' });
        }

        const followerId = req.user.id
        const followingId = req.params.id || req.body.id;

        await followersModel.destroy({
            where: {
                follower_id: followerId,
                following_id: followingId,
            },
        });
        res.status(200).json({ message: 'User unfollowed successfully' });

    } catch (error) {
        console.error('Error unfollowing user:', error);
        res.status(500).json({ error: 'Unable to unfollow user' });
    }
}



//---------------------------- GET FOLLOWING USER BY ID  -------------------------------------------//

const getFollowedUser = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to get followed user.' });
        }

        const followerId = req.user.id
        const followingId = req.params.id || req.body.id;

        const followingUser = await followersModel.findOne({
            where: {
                follower_id: followerId,
                following_id: followingId,
            },
        });

        if (!followingUser) {
            return res.status(404).json({ error: 'Following user not found' });
        }
        res.status(200).json({ message: 'Following User' });

    } catch (error) {
        console.error('Error fetching following user:', error);
        res.status(500).json({ error: 'Unable to get following user' });
    }
}



//---------------------------- GET ALL USER FOLLOWING  -------------------------------------------//

const getAllUserFollowing = async (req, res) => {
    try {
        const userId = req.params.id;

        const allUserFollowing = await followersModel.findAll({
            where: {
                follower_id: userId,
            }
        })

        res.status(200).json(allUserFollowing);
    } catch (error) {
        console.error('Error fetching user following:', error);
        res.status(500).json({ error: 'An error occurred while fetching following users.' });
    }
}



//---------------------------- GET ALL USER FOLLOWER  -------------------------------------------//

const getAllUserFollower = async (req, res) => {
    try {
        const userId = req.params.id;

        const allUserFollower = await followersModel.findAll({
            where: {
                following_id: userId,
            }
        })

        res.status(200).json(allUserFollower);
    } catch (error) {
        console.error('Error fetching user following:', error);
        res.status(500).json({ error: 'An error occurred while fetching following users.' });
    }
}




module.exports = { followUser, unfollowUser, getFollowedUser, getAllUserFollowing, getAllUserFollower }