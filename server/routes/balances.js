import express from 'express';
import { getBalances, getBalanceSummary } from '../controllers/balanceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getBalances);
router.get('/summary', protect, getBalanceSummary);

export default router;