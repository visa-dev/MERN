const Product = require('../models/Product');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const advancedFiltering = asyncHandler(async (req, res, next) => {
  let query;


  const reqQuery = { ...req.query };

 
  const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
  removeFields.forEach(param => delete reqQuery[param]);


  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

 
  if (req.query.search) {
    query = Product.find({
      $text: { $search: req.query.search },
      ...JSON.parse(queryStr),
      isActive: true,
    });
  } else {
    query = Product.find({ ...JSON.parse(queryStr), isActive: true });
  }


  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const startIndex = (page - 1) * limit;
  const total = await Product.countDocuments(query._conditions);

  query = query.skip(startIndex).limit(limit);

 

  const results = await query;

  // Pagination result
  const pagination = {};
  const totalPages = Math.ceil(total / limit);

  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination: {
      ...pagination,
      page,
      limit,
      totalPages,
      total,
    },
    data: results,
  };

  next();
});

exports.getProducts = advancedFiltering;

exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.id,
    isActive: true,
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;

  if (!['Men', 'Women', 'Kids'].includes(category)) {
    return next(new AppError('Invalid category', 400));
  }

  const products = await Product.find({
    category,
    isActive: true,
  })
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Product.countDocuments({ category, isActive: true });

  res.status(200).json({
    success: true,
    count: products.length,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      total,
    },
    data: products,
  });
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    featured: true,
    isActive: true,
  })
    .sort('-createdAt')
    .limit(8);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});