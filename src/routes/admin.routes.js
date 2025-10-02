import express from 'express';
import { protect, hasRole } from '../middleware/auth.middleware.js';
import { getAllOrders, assignDriverToOrder } from '../controllers/admin.controller.js';

const router = express.Router();

// GET /api/v1/admin/orders - Admin only
router.get('/orders', protect, hasRole('admin'), getAllOrders);

// PUT /api/v1/admin/orders/:orderId/assign - Admin only
router.put('/orders/:orderId/assign', protect, hasRole('admin'), assignDriverToOrder);

export default router;


