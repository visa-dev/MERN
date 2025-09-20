const User = require("../models/User");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/appError");

// 🔑 Helper: Generate JWT
const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// 📝 Signup
exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email & password are required", 400));
  }

  // Check duplicate
  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return next(new AppError("Email already registered", 409));

  // Create user (password will be hashed automatically in pre-save hook)
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
  });

  const token = signToken(user);

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

// 🔐 Login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email & password are required", 400));
  }

  // Explicitly select password (since it's hidden by default in schema)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError("Invalid credentials", 401));
  }

  const token = signToken(user);

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});
