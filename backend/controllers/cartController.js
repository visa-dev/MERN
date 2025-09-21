const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const getOrCreateCart = async (userId, sessionId) => {
  let cart;

  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ sessionId, items: [] });
    }
  } else {
    throw new AppError('User ID or session ID required', 400);
  }

  return cart;
};

exports.getCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user?.id;

  const cart = await getOrCreateCart(userId, sessionId);
  await cart.populate('items.product');

  res.status(200).json({
    success: true,
    data: cart,
  });
});

exports.addItem = asyncHandler(async (req, res, next) => {
  const { productId, size, quantity, sessionId } = req.body;
  const userId = req.user?.id;

  // Validate product exists and has stock
  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  const sizeStock = product.sizes.find(s => s.size === size);
  if (!sizeStock || sizeStock.stock < quantity) {
    return next(new AppError('Insufficient stock for selected size', 400));
  }

  const cart = await getOrCreateCart(userId, sessionId);

  // Check if item already exists in cart
  const existingItem = cart.items.find(
    item => item.product.toString() === productId && item.size === size
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > sizeStock.stock) {
      return next(new AppError(`Cannot add more than ${sizeStock.stock} items of this size`, 400));
    }
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({
      product: productId,
      name: product.name,
      size,
      quantity,
      price: product.price,
      imageUrl: product.imageUrl,
      maxStock: sizeStock.stock,
    });
  }

  await cart.save();
  await cart.populate('items.product');

  logger.info(`Item added to cart: ${product.name} (${size})`);

  res.status(200).json({
    success: true,
    data: cart,
  });
});

exports.updateItem = asyncHandler(async (req, res, next) => {
  const { itemId, quantity, sessionId } = req.body;
  const userId = req.user?.id;

  if (quantity < 0 || quantity > 10) {
    return next(new AppError('Quantity must be between 0 and 10', 400));
  }

  const cart = await getOrCreateCart(userId, sessionId);
  const item = cart.items.id(itemId);

  if (!item) {
    return next(new AppError('Item not found in cart', 404));
  }

  if (quantity === 0) {
    cart.items.pull(itemId);
  } else {
    if (quantity > item.maxStock) {
      return next(new AppError(`Cannot add more than ${item.maxStock} items of this size`, 400));
    }
    item.quantity = quantity;
  }

  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    success: true,
    data: cart,
  });
});

exports.removeItem = asyncHandler(async (req, res, next) => {
  const { itemId, sessionId } = req.body;
  const userId = req.user?.id;

  const cart = await getOrCreateCart(userId, sessionId);
  const item = cart.items.id(itemId);

  if (!item) {
    return next(new AppError('Item not found in cart', 404));
  }

  cart.items.pull(itemId);
  await cart.save();
  await cart.populate('items.product');

  res.status(200).json({
    success: true,
    data: cart,
  });
});

exports.clearCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user?.id;

  const cart = await getOrCreateCart(userId, sessionId);
  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart cleared successfully',
  });
});

exports.mergeCarts = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user.id;


  const sessionCart = await Cart.findOne({ sessionId }).populate('items.product');
  const userCart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!sessionCart || sessionCart.items.length === 0) {
    return res.status(200).json({
      success: true,
      data: userCart,
      message: 'No items to merge',
    });
  }

  for (const sessionItem of sessionCart.items) {
    const existingItem = userCart.items.find(
      item => item.product._id.toString() === sessionItem.product._id.toString() && item.size === sessionItem.size
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + sessionItem.quantity;
      if (newQuantity <= existingItem.maxStock) {
        existingItem.quantity = newQuantity;
      } else {
        existingItem.quantity = existingItem.maxStock;
      }
    } else {
      userCart.items.push(sessionItem);
    }
  }

  await userCart.save();
  await sessionCart.deleteOne();

  await userCart.populate('items.product');

  res.status(200).json({
    success: true,
    data: userCart,
    message: 'Carts merged successfully',
  });
});