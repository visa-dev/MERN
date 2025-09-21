const express = require('express');
const { cartValidation } = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');
const {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts,
} = require('../controllers/cartController');

const router = express.Router();

router.use(optionalAuth);

router.get('/', cartValidation.getCart, getCart);
router.post('/add', cartValidation.addItem, addItem);
router.patch('/update', cartValidation.updateItem, updateItem);
router.delete('/remove', cartValidation.removeItem, removeItem);
router.delete('/clear', clearCart);
router.post('/merge', mergeCarts);

module.exports = router;