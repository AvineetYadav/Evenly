import express from 'express';
import { getRecentActivity, getAllActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getAllActivity);
router.get('/recent', protect, getRecentActivity);

export default router;