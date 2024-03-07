// reviewsController.js
const { reviewsModel, reviewImagesModel } = require('../config/sequelizeConfig');
const { uploadReviewImages, createReviewImages } = require('./imagesController');

const createReviews = async (req, res) => {
    try {

        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to submit a review.' });
        }

        const { reviewer_id, target_id, role, rating, comment } = req.body;


        // Create the review
        const review = await reviewsModel.create({
            reviewer_id,
            target_id,
            role,
            rating,
            comment,
        });

        // If there are images attached, handle each one
        if (req.files && req.files.length > 0) {
            const imageUrls = await uploadReviewImages(req.files);

            // Save the image details to the reviewImagesModel
            await createReviewImages(review.id, imageUrls);
        }

        res.status(201).json({ success: true, review });
    } catch (error) {
        console.error('createReviews Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create review.' });
    }
};

module.exports = { createReviews };
