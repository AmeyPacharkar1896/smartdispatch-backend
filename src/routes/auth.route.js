import express from 'express';
const router = express.Router();

import { 
  signupController, 
  loginController, 
  logoutController,
  refreshAccessTokenController
} from '../controllers/auth.controller.js'; // Note the .js extension is often required in ESM

//middleware
import { protect, hasRole } from '../middleware/auth.middleware.js';

router.post('/signup', signupController);
router.post('/login', loginController);
router.post('/refresh-token', refreshAccessTokenController);

//protected
router.post('/logout', protect, logoutController);


export default router;