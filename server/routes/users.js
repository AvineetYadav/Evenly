import express from 'express';
import { getCurrentUser, updateProfile, updatePassword, searchUsers } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.get('/search', protect, searchUsers);

export default router;
