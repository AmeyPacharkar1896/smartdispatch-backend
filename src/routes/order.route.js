import express from 'express';
const router = express.Router();

// Import middleware
import { protect } from '../middleware/auth.middleware.js';

// Import controller
import { requestNewDelivery, confirmOrderPayment, getCustomerOrders, customerRateDriver, cancelOrder, getOrderDetails } from '../controllers/order.controller.js';

// POST route for creating new delivery orders
router.post('/', protect, requestNewDelivery);

// POST route for confirming order payment
router.post('/:orderId/pay', protect, confirmOrderPayment);

// GET route for retrieving customer's orders
router.get('/customer', protect, getCustomerOrders);

// GET route for retrieving single order details
router.get('/:orderId', protect, getOrderDetails);

// POST route for rating a driver after delivery
router.post('/:orderId/rate', protect, customerRateDriver);

// PUT route for cancelling an order
router.put('/:orderId/cancel', protect, cancelOrder);

export default router;
