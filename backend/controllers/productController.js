const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

exports.listProducts = asyncHandler(async (req, res) => {
  const { search, category, size, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (size) filter.sizes = size;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (search) {
    // text search with fallback to regex if text index missing
    filter.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const query = Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
  const [items, total] = await Promise.all([query.exec(), Product.countDocuments(filter)]);
  res.json({ success: true, data: items, meta: { total, page: Number(page), limit: Number(limit) } });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError("Product not found", 404));
  res.json({ success: true, data: product });
});
