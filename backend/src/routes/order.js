import express from 'express';
import OrderController from '../controllers/orderController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create a new order
router.post('/create', auth, OrderController.createOrder);

// Get user orders
router.get('/user', auth, OrderController.getUserOrders);

// Get order by ID
router.get('/:orderId', auth, OrderController.getOrderById);

// Retry failed order
router.post('/:orderId/retry', auth, OrderController.retryOrder);

export default router;
