const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

async function getOrCreateCart(ownerId, cartToken) {
  if (ownerId) {
    let cart = await Cart.findOne({ owner: ownerId }).populate("items.product");
    if (!cart) cart = await Cart.create({ owner: ownerId, items: [] });
    return cart;
  } else if (cartToken) {
    let cart = await Cart.findOne({ cartToken }).populate("items.product");
    if (!cart) cart = await Cart.create({ cartToken, items: [] });
    return cart;
  } else {
    const token = uuidv4();
    const cart = await Cart.create({ cartToken: token, items: [] });
    cart._newToken = token;
    return cart;
  }
}

exports.getCart = asyncHandler(async (req, res) => {
  const ownerId = req.userId || null;
  const cartToken = req.query.cartToken || null;
  const cart = await getOrCreateCart(ownerId, cartToken);
  res.json({ success: true, cart, cartToken: cart._newToken || cart.cartToken });
});

exports.addItem = asyncHandler(async (req, res, next) => {
  const { productId, size, quantity = 1, cartToken } = req.body;
  if (!productId || !size) return next(new AppError("productId and size are required", 400));
  const ownerId = req.userId || null;
  const cart = await getOrCreateCart(ownerId, cartToken);
  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));
  const existing = cart.items.find(i => i.product.toString() === productId && i.size === size);
  if (existing) existing.quantity += Number(quantity);
  else cart.items.push({ product: product._id, size, quantity: Number(quantity) });
  await cart.save();
  await cart.populate("items.product");
  res.status(201).json({ success: true, cart, cartToken: cart._newToken || cart.cartToken });
});

exports.updateItem = asyncHandler(async (req, res, next) => {
  const { itemId, quantity, cartToken } = req.body;
  if (!itemId) return next(new AppError("itemId required", 400));
  const ownerId = req.userId || null;
  const cart = await getOrCreateCart(ownerId, cartToken);
  const item = cart.items.id(itemId);
  if (!item) return next(new AppError("Item not found", 404));
  if (Number(quantity) <= 0) item.remove();
  else item.quantity = Number(quantity);
  await cart.save();
  await cart.populate("items.product");
  res.json({ success: true, cart, cartToken: cart.cartToken });
});

exports.removeItem = asyncHandler(async (req, res, next) => {
  const { itemId, cartToken } = req.body;
  if (!itemId) return next(new AppError("itemId required", 400));
  const ownerId = req.userId || null;
  const cart = await getOrCreateCart(ownerId, cartToken);
  const item = cart.items.id(itemId);
  if (!item) return next(new AppError("Item not found", 404));
  item.remove();
  await cart.save();
  await cart.populate("items.product");
  res.json({ success: true, cart, cartToken: cart.cartToken });
});
