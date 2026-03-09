import express from 'express';
import { getUsers, deleteUser, toggleBlockUser } from '../controllers/userController.js';
import { protect, admin, turfOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getUsers);

router.route('/:id')
    .delete(protect, admin, deleteUser);

router.put('/:id/block', protect, turfOwner, toggleBlockUser);

export default router;
