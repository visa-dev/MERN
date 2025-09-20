const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();
  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
  } catch (err) {
    // invalid token => ignore (treat as guest)
  }
  next();
});

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next(new AppError("Authorization required", 401));
  const token = header.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    next(new AppError("Invalid token", 401));
  }
});

module.exports = { optionalAuth, requireAuth };
