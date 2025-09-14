import express from 'express';
const router = express.Router();

// Import middleware
import { protect } from '../middleware/auth.middleware.js';

// Import controller
import { updateCurrentUserProfile } from '../controllers/user.controller.js';

// PATCH route for updating current user profile
router.patch('/me', protect, updateCurrentUserProfile);

export default router;
