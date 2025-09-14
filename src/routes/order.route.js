import express from 'express';
const router = express.Router();

// Import middleware
import { protect } from '../middleware/auth.middleware.js';

// Import controller
import { requestNewDelivery, confirmOrderPayment, getCustomerOrders } from '../controllers/order.controller.js';

// POST route for creating new delivery orders
router.post('/', protect, requestNewDelivery);

// POST route for confirming order payment
router.post('/:orderId/pay', protect, confirmOrderPayment);

// GET route for retrieving customer's orders
router.get('/customer', protect, getCustomerOrders);

export default router;
