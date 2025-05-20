import express from 'express';
import { createSettlement, getSettlementSuggestions } from '../controllers/settlementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, createSettlement);

router.get('/suggestions', protect, getSettlementSuggestions);

export default router;