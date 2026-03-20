import express from 'express';
import { createAccount, getAccounts, deleteAccount } from '../controllers/paymentAccountController.js';
import { protect, turfOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, turfOwner, createAccount).get(protect, turfOwner, getAccounts);
router.route('/:id').delete(protect, turfOwner, deleteAccount);

export default router;
