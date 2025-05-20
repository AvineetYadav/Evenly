import express from 'express';
import { 
  createExpense, 
  getExpenses, 
  getExpenseById, 
  getExpenseStats 
} from '../controllers/expenseController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.get('/stats', protect, getExpenseStats);

router.get('/:id', protect, getExpenseById);

export default router;