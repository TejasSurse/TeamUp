import express from 'express';
import { createBooking, getMyBookings, getOwnerBookings, getBookings, updateBookingStatus, getBookedSlots, updateBooking, deleteBooking } from '../controllers/bookingController.js';
import { protect, admin, turfOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createBooking)
    .get(protect, admin, getBookings);

router.get('/mybookings', protect, getMyBookings);
router.get('/owner', protect, turfOwner, getOwnerBookings);
router.get('/slots/:turfId', getBookedSlots); // public

router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id', protect, turfOwner, updateBooking);
router.delete('/:id', protect, turfOwner, deleteBooking);

export default router;
