const { celebrate, Joi, Segments, errors } = require('celebrate');
const mongoose = require('mongoose');

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'Object ID validation');

const password = Joi.string().min(6).max(30).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).message(
  'Password must contain at least one lowercase letter, one uppercase letter, and one number'
);

const email = Joi.string().email().lowercase().trim();

const price = Joi.number().min(0).precision(2);

const authValidation = {
  register: celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string().min(2).max(50).trim().required()
        .messages({
          'string.empty': 'Name is required',
          'string.min': 'Name must be at least 2 characters',
          'string.max': 'Name must be less than 50 characters'
        }),
      email: email.required()
        .messages({
          'string.email': 'Please provide a valid email',
          'string.empty': 'Email is required'
        }),
      password: password.required()
        .messages({
          'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
          'string.empty': 'Password is required'
        }),
    }),
  }),

  login: celebrate({
    [Segments.BODY]: Joi.object({
      email: email.required()
        .messages({
          'string.email': 'Please provide a valid email',
          'string.empty': 'Email is required'
        }),
      password: Joi.string().required()
        .messages({
          'string.empty': 'Password is required'
        }),
    }),
  }),
};

const productValidation = {
  getProducts: celebrate({
    [Segments.QUERY]: Joi.object({
      search: Joi.string().trim().max(100),
      category: Joi.string().valid('Men', 'Women', 'Kids'),
      size: Joi.string().valid('S', 'M', 'L', 'XL'),
      minPrice: price,
      maxPrice: price,
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(12),
      sort: Joi.string().valid('price', '-price', 'name', '-name', 'createdAt', '-createdAt'),
      featured: Joi.boolean(),
    }),
  }),

  getProduct: celebrate({
    [Segments.PARAMS]: Joi.object({
      id: objectId.required()
        .messages({
          'any.invalid': 'Invalid product ID'
        }),
    }),
  }),
};

const cartValidation = {
  getCart: celebrate({
    [Segments.QUERY]: Joi.object({
      sessionId: Joi.string().max(100),
    }),
  }),

  addItem: celebrate({
    [Segments.BODY]: Joi.object({
      productId: objectId.required()
        .messages({
          'any.invalid': 'Invalid product ID'
        }),
      size: Joi.string().valid('S', 'M', 'L', 'XL').required()
        .messages({
          'any.only': 'Size must be S, M, L, or XL'
        }),
      quantity: Joi.number().integer().min(1).max(10).default(1)
        .messages({
          'number.min': 'Quantity must be at least 1',
          'number.max': 'Quantity cannot exceed 10'
        }),
      sessionId: Joi.string().max(100),
    }),
  }),

  updateItem: celebrate({
    [Segments.BODY]: Joi.object({
      itemId: objectId.required()
        .messages({
          'any.invalid': 'Invalid item ID'
        }),
      quantity: Joi.number().integer().min(0).max(10).required()
        .messages({
          'number.min': 'Quantity cannot be negative',
          'number.max': 'Quantity cannot exceed 10'
        }),
      sessionId: Joi.string().max(100),
    }),
  }),

  removeItem: celebrate({
    [Segments.BODY]: Joi.object({
      itemId: objectId.required()
        .messages({
          'any.invalid': 'Invalid item ID'
        }),
      sessionId: Joi.string().max(100),
    }),
  }),
};

const orderValidation = {
  checkout: celebrate({
    [Segments.BODY]: Joi.object({
      sessionId: Joi.string().max(100),
      email: email.when('sessionId', {
        is: Joi.exist(),
        then: email.required(),
        otherwise: email.optional(),
      }),
      shippingAddress: Joi.object({
        firstName: Joi.string().max(50).required(),
        lastName: Joi.string().max(50).required(),
        street: Joi.string().max(100).required(),
        city: Joi.string().max(50).required(),
        state: Joi.string().max(50).required(),
        zipCode: Joi.string().max(20).required(),
        country: Joi.string().max(50).default('US'),
        phone: Joi.string().max(20),
      }).required(),
      billingAddress: Joi.object({
        firstName: Joi.string().max(50).required(),
        lastName: Joi.string().max(50).required(),
        street: Joi.string().max(100).required(),
        city: Joi.string().max(50).required(),
        state: Joi.string().max(50).required(),
        zipCode: Joi.string().max(20).required(),
        country: Joi.string().max(50).default('US'),
      }).optional(),
      paymentMethod: Joi.string().valid('card', 'paypal', 'bank_transfer').default('card'),
    }),
  }),

  getOrders: celebrate({
    [Segments.QUERY]: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(10),
      status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    }),
  }),
};

const validationErrorFormatter = (error) => {
  return {
    success: false,
    message: 'Validation failed',
    errors: error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type,
    })),
  };
};

module.exports = {
  authValidation,
  productValidation,
  cartValidation,
  orderValidation,
  validationErrorFormatter,
  celebrateErrors: errors(),
};