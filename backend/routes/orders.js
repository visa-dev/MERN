const express = require('express');
const { orderValidation } = require('../middleware/validation');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  checkout,
  getOrders,
  getOrder,
  cancelOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.use(optionalAuth);
router.post('/checkout', orderValidation.checkout, checkout);

router.use(protect);
router.get('/', orderValidation.getOrders, getOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

module.exports = router;