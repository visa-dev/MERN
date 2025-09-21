const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

exports.checkout = asyncHandler(async (req, res, next) => {
  const { sessionId, email, shippingAddress, billingAddress, paymentMethod } = req.body;
  const userId = req.user?.id;

 
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId }).populate('items.product');
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId }).populate('items.product');
  } else {
    return next(new AppError('User ID or session ID required', 400));
  }

  if (!cart || cart.items.length === 0) {
    return next(new AppError('Cart is empty', 400));
  }


  let total = 0;
  const orderItems = [];

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product._id);
    const sizeStock = product.sizes.find(s => s.size === cartItem.size);

    if (!sizeStock || sizeStock.stock < cartItem.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name} (${cartItem.size})`, 400));
    }

    const itemTotal = cartItem.price * cartItem.quantity;
    total += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      size: cartItem.size,
      quantity: cartItem.quantity,
      price: cartItem.price,
      imageUrl: product.imageUrl,
    });

    
    sizeStock.stock -= cartItem.quantity;
    product.salesCount += cartItem.quantity;
    await product.save();
  }

  const tax = total * 0.1; // 10% tax
  const shipping = total > 1000? 0 : 10; // Free shipping over Rs : 1000
  const finalTotal = total + tax + shipping;

  
  const order = await Order.create({
    user: userId || null,
    items: orderItems,
    subtotal: total,
    tax,
    shipping,
    total: finalTotal,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    status: 'confirmed',
    paymentStatus: 'paid',
  });

  
  cart.items = [];
  await cart.save();

  // Send confirmation email
  try {
    const recipientEmail = userId ? req.user.email : email;
    if (recipientEmail) {
      await emailService.sendOrderConfirmation(order, recipientEmail);
      logger.info(`Order confirmation email sent to: ${recipientEmail}`);
    }
  } catch (emailError) {
    logger.error('Failed to send order confirmation email:', emailError);

  }

  logger.info(`New order created: ${order._id}`);

  res.status(201).json({
    success: true,
    data: order,
    message: 'Order created successfully',
  });
});

exports.getOrders = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const { status } = req.query;

  const filter = { user: userId };
  if (status) {
    filter.status = status;
  }

  const orders = await Order.find(filter)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: orders.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    },
    data: orders,
  });
});

exports.getOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await Order.findOne({
    _id: id,
    user: userId,
  });

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const order = await Order.findOne({
    _id: id,
    user: userId,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (!order) {
    return next(new AppError('Order cannot be cancelled', 400));
  }

  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const sizeStock = product.sizes.find(s => s.size === item.size);
      if (sizeStock) {
        sizeStock.stock += item.quantity;
        product.salesCount -= item.quantity;
        await product.save();
      }
    }
  }

  order.status = 'cancelled';
  order.paymentStatus = 'refunded';
  await order.save();

  res.status(200).json({
    success: true,
    data: order,
    message: 'Order cancelled successfully',
  });
});