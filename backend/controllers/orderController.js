const Order = require("../models/Order");
const Cart = require("../models/Cart");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");
const { sendOrderConfirmation } = require("../utils/mailer");

exports.checkout = asyncHandler(async (req, res, next) => {
  const { cartToken, email } = req.body;
  const ownerId = req.userId || null;
  let cart;
  if (ownerId) cart = await Cart.findOne({ owner: ownerId }).populate("items.product");
  else if (cartToken) cart = await Cart.findOne({ cartToken }).populate("items.product");
  else return next(new AppError("Cart token or authenticated user required", 400));
  if (!cart || cart.items.length === 0) return next(new AppError("Cart empty", 400));

  const items = [];
  let total = 0;
  cart.items.forEach(it => {
    const product = it.product;
    items.push({ product: product._id, name: product.name, price: product.price, size: it.size, quantity: it.quantity });
    total += product.price * it.quantity;
  });

  const order = await Order.create({ user: ownerId || null, items, total });
  cart.items = [];
  await cart.save();

  let emailPreviewUrl = null;
  let toEmail = null;
  if (ownerId) {
    const u = await User.findById(ownerId);
    toEmail = u?.email || null;
  } else if (email) toEmail = email;

  if (toEmail) {
    emailPreviewUrl = await sendOrderConfirmation(toEmail, order);
  }

  res.status(201).json({ success: true, order, emailPreviewUrl });
});

exports.listOrders = asyncHandler(async (req, res, next) => {
  const ownerId = req.userId;
  if (!ownerId) return next(new AppError("Auth required", 401));
  const orders = await Order.find({ user: ownerId }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});
