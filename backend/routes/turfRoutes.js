import express from 'express';
import { getTurfs, getTurfById, createTurf, updateTurf, deleteTurf, getMyTurfs } from '../controllers/turfController.js';
import { protect, turfOwner, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getTurfs)
    .post(protect, turfOwner, createTurf);

router.get('/owner/me', protect, turfOwner, getMyTurfs);

router.route('/:id')
    .get(getTurfById)
    .put(protect, turfOwner, updateTurf)
    .delete(protect, turfOwner, deleteTurf);

export default router;
