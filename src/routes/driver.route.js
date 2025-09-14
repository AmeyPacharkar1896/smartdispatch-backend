import express from 'express';
const router = express.Router();

// Import middleware
import { protect, hasRole } from '../middleware/auth.middleware.js';

// Import controller
import { createMyDriverProfile } from '../controllers/driver.controller.js';

// POST route for creating driver profile
router.post('/me/profile', protect, hasRole('driver'), createMyDriverProfile);

export default router;
