import express from 'express';
import { createExpense, getExpenses, updateExpense, deleteExpense } from '../controllers/expenseController.js';
import { protect, turfOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, turfOwner, createExpense).get(protect, turfOwner, getExpenses);
router.route('/:id').put(protect, turfOwner, updateExpense).delete(protect, turfOwner, deleteExpense);

export default router;
