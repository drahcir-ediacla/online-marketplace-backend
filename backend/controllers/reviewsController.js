const { reviewsModel, reviewImagesModel } = require('../config/sequelizeConfig');

const createReviews = async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Authentication required to submit a review.' });
        }


        const userId = req.user.id;
        const { reviewer_name, target_id, role, product_id, chat_id, rating, comment, profile_pic, imageUrls } = req.body;

        // Validate rating range (1 to 5)
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating. Please choose a rating between 1 and 5.' });
        }

        // Validate role (strictly equal to "Buyer" or "Seller")
        if (role !== 'Buyer' && role !== 'Seller') {
            return res.status(400).json({ error: 'Invalid role. Role must be either "Buyer" or "Seller".' });
        }

        // Create the review
        const newReview = await reviewsModel.create({
            chat_id,
            reviewer_id: userId,
            reviewer_name,
            target_id,
            role,
            product_id,
            rating,
            comment,
            profile_pic,
        });

        // Insert associated image and video URLs for the product
        if (imageUrls && imageUrls.length > 0) {
            const imageInsertPromises = [];

            imageUrls.forEach((mediaUrl) => {
                imageInsertPromises.push(
                    reviewImagesModel.create({
                        review_id: newReview.review_id,
                        image_url: mediaUrl,
                    })
                );
            });

            console.log('File URLs for images:', imageInsertPromises);

            await Promise.all(imageInsertPromises);

            newReview.file_urls = imageUrls;
            console.log('Product with files:', newReview);
        }

        res.status(201).json({ success: true, newReview });
    } catch (error) {
        console.error('createReviews Error:', error);
        res.status(500).json({ success: false, error: 'Failed to create review.' });
    }
};



// --------------- GET REVIEWS BY TARGET ID  --------------- //
const getReviewsTargetId = async (req, res) => {
    try {
        const { targetId } = req.params; // Extract target_id from params
        console.log('target_id:', targetId )

        let whereClause = {}; // Initialize an empty where clause

        // Check if role is provided in request params
        if (req.params.role) {
            whereClause.role = req.params.role;
        }

        const reviewsTargetId = await reviewsModel.findAll({
            attributes: ['review_id', 'target_id', 'reviewer_name', 'role', 'rating', 'comment', 'profile_pic', 'createdAt'],
            where: {
                target_id: targetId , // Use the extracted target_id
                ...whereClause, // Spread the whereClause object to include its properties
            },
            include: [
                {
                    model: reviewImagesModel,
                    attributes: ['id', 'review_id', 'image_url'],
                    as: 'images',
                },
            ]
        });


        const allReviewsTargetId = await reviewsModel.findAll({
            attributes: ['rating'],
            where: {
                target_id: targetId , // Use the extracted target_id
            },
        });

        // Initialize object to store rating breakdown
        let ratingBreakdown = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };

        // Calculate total average rating
        let totalRating = 0;
        allReviewsTargetId.forEach(review => {
            totalRating += review.rating;

            // Increment count for corresponding rating category
            ratingBreakdown[review.rating]++;
        });
        
        let averageRating = totalRating / allReviewsTargetId.length;
        if (isNaN(averageRating)) {
            averageRating = 0; // Set average rating to 0 if it's NaN
        } else {
            averageRating = averageRating.toFixed(1);
        }

        const totalReviews = allReviewsTargetId.length

        // Respond with reviews and average rating
        res.json({ reviewsTargetId, allReviewsTargetId, averageRating, totalReviews, ratingBreakdown });

    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ error: 'Failed to retrieve reviews.' });
    }
};




module.exports = { createReviews, getReviewsTargetId };
