const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null,
    index: true,
    sparse: true
  },
  cartToken: { 
    type: String, 
    default: null,
    index: true,
    sparse: true
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    size: {
      type: String,
      required: true,
      enum: ['S', 'M', 'L', 'XL']
    },
    quantity: { 
      type: Number, 
      default: 1,
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Quantity cannot exceed 10']
    },
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ owner: 1 }, { unique: true, sparse: true });
cartSchema.index({ cartToken: 1 }, { unique: true, sparse: true });
cartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL


cartSchema.virtual('total').get(function() {
  return this.items.reduce((total, item) => {
   
    return total + (item.product?.price || 0) * item.quantity;
  }, 0);
});


cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

cartSchema.methods.addItem = function(productId, size, quantity = 1) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId && item.size === size
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, size, quantity });
  }

  return this.save();
};


cartSchema.methods.removeItem = function(itemId) {
  this.items = this.items.filter(item => item._id.toString() !== itemId);
  return this.save();
};


cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    if (quantity <= 0) {
      this.removeItem(itemId);
    } else {
      item.quantity = quantity;
    }
  }
  return this.save();
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);