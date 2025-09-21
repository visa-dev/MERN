const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { jwt: jwtConfig } = require('../config/config');
const logger = require('../utils/logger');

const verifyToken = promisify(jwt.verify);

const signToken = (userId) => {
  return jwt.sign(
    { userId },
    jwtConfig.secret,
    { 
      expiresIn: jwtConfig.expiresIn,
      issuer: 'clothing-ecom-api',
      audience: 'clothing-ecom-users',
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  user.password = undefined;

  const cookieOptions = {
    expires: new Date(
      Date.now() + jwtConfig.cookieExpiresIn * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  try {
    const decoded = await verifyToken(token, jwtConfig.secret);
    const currentUser = await User.findById(decoded.userId);
    
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password. Please log in again.', 401));
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (error) {
    logger.error('JWT verification error:', error);
    return next(new AppError('Invalid token. Please log in again.', 401));
  }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = await verifyToken(token, jwtConfig.secret);
      const currentUser = await User.findById(decoded.userId);
      
      if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
        req.user = currentUser;
        res.locals.user = currentUser;
      }
    } catch (error) {
      logger.warn('Optional auth token verification failed:', error.message);
    }
  }

  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = {
  signToken,
  createSendToken,
  protect,
  optionalAuth,
  restrictTo,
};