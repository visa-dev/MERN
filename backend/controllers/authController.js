const User = require('../models/User');
const { createSendToken } = require('../middleware/auth');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    return next(new AppError('Email already registered', 409));
  }

  
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  logger.info(`New user registered: ${user.email}`);
  
  createSendToken(user, 201, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }


  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${user.email}`);
  
  createSendToken(user, 200, res);
});

exports.logout = asyncHandler(async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    },
  });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;
  const updatedData = {};

  if (name) updatedData.name = name.trim();
  if (email) {
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return next(new AppError('Email already taken', 409));
      }
      updatedData.email = email.toLowerCase().trim();
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updatedData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    },
  });
});