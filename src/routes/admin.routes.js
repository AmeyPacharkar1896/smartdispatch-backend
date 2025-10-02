import express from 'express';
import { protect, hasRole } from '../middleware/auth.middleware.js';
import { getAllOrders, assignDriverToOrder, getAllUsers } from '../controllers/admin.controller.js';

const router = express.Router();

// GET /api/v1/admin/orders - Admin only
router.get('/orders', protect, hasRole('admin'), getAllOrders);

// PUT /api/v1/admin/orders/:orderId/assign - Admin only
router.put('/orders/:orderId/assign', protect, hasRole('admin'), assignDriverToOrder);

// GET /api/v1/admin/users - Admin only
router.get('/users', protect, hasRole('admin'), getAllUsers);

export default router;


