const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('../config/cloudinaryConfig');

cloudinary.config(cloudinaryConfig);

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the route handling function separately
const uploadChatImage = (req, res) => {
  try {
    // Create a Promise to handle the upload process
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'chat_images' }, // Optional: replace with your desired folder
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      stream.end(req.file.buffer);
    });

    // Wait for the uploadPromise to resolve
    uploadPromise.then((result) => {
      res.status(200).json({ success: true, imageUrl: result.url });
    }).catch((error) => {
      console.error(error);
      res.status(500).json({ success: false, error: 'Error uploading image to Cloudinary' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error uploading image to Cloudinary' });
  }
};

// Use multer middleware in the route
const uploadChatImageMiddleware = upload.single('image');

module.exports = { uploadChatImageMiddleware, uploadChatImage };
