const express = require('express');
const { productValidation } = require('../middleware/validation');
const {
  getProducts,
  getProduct,
  getProductsByCategory,
  getFeaturedProducts,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', productValidation.getProducts, getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', productValidation.getProduct, getProduct);

module.exports = router;