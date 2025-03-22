// testCloudinary.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  try {
    const result = await cloudinary.uploader.upload('https://picsum.photos/200');
    console.log('Upload success:', result.secure_url);
  } catch (error) {
    console.error('Upload error:', error);
  }
})();
