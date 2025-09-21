const AppError = require('./appError');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Async handler error:', error);
    
    if (error.isOperational) {
      return next(error);
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new AppError(messages.join('. '), 400));
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new AppError(`${field} already exists`, 400));
    }
    
    if (error.name === 'CastError') {
      return next(new AppError('Invalid resource ID', 400));
    }
    
    next(new AppError('Internal server error', 500));
  });
};

module.exports = asyncHandler;