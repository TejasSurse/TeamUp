import express from 'express';
import upload from '../config/cloudinary.js';
import { protect, turfOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, turfOwner, upload.array('images', 4), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No image uploaded' });
        }

        const imageUrls = req.files.map(file => file.path);
        res.status(200).json({ urls: imageUrls });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Image upload failed' });
    }
});

export default router;
