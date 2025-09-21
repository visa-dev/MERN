const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    text: true,
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: { 
    type: String, 
    text: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: { 
    type: Number, 
    required: true,
    min: [0, 'Price cannot be negative']
  },
  imageUrl: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  category: { 
    type: String, 
    enum: ['Men', 'Women', 'Kids'], 
    required: true,
    index: true
  },
  sizes: [String],
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });


productSchema.virtual('sizeAvailability').get(function() {
  const availability = {};
  this.sizes.forEach(size => {
    availability[size] = true;
  });
  return availability;
});


productSchema.methods.hasSize = function(size) {
  return this.sizes.includes(size);
};

productSchema.statics.getByCategory = function(category, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ category })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);