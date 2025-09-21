const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const logger = require('./logger');

dotenv.config();

const products = [
  {
    name: "Classic White T-Shirt",
    description: "100% cotton classic white t-shirt for everyday wear. Comfortable and versatile.",
    price: 24.99,
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Black Denim Jacket",
    description: "Stylish black denim jacket with a modern fit. Perfect for casual outings.",
    price: 89.99,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Slim Fit Jeans",
    description: "Comfortable slim fit jeans with stretch for maximum comfort.",
    price: 59.99,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Floral Summer Dress",
    description: "Beautiful floral print dress perfect for summer occasions.",
    price: 79.99,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500",
    category: "Women",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Women's Running Shoes",
    description: "Lightweight running shoes with excellent cushioning and support.",
    price: 99.99,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    category: "Women",
    sizes: ["S", "M", "L"]
  },
  {
    name: "Kids' Superhero T-Shirt",
    description: "Fun superhero themed t-shirt for kids. 100% cotton and machine washable.",
    price: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=500",
    category: "Kids",
    sizes: ["S", "M", "L"]
  },
  {
    name: "Men's Leather Boots",
    description: "Durable leather boots with comfortable insoles and rugged soles.",
    price: 129.99,
    imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Women's Handbag",
    description: "Elegant handbag with multiple compartments and adjustable strap.",
    price: 69.99,
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500",
    category: "Women",
    sizes: ["One Size"]
  },
  {
    name: "Kids' Winter Jacket",
    description: "Warm and waterproof winter jacket for kids. Perfect for cold weather.",
    price: 49.99,
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500",
    category: "Kids",
    sizes: ["S", "M", "L"]
  },
  {
    name: "Men's Formal Shirt",
    description: "Crisp formal shirt suitable for office wear and special occasions.",
    price: 44.99,
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Women's Yoga Pants",
    description: "Comfortable and stretchy yoga pants for workouts or casual wear.",
    price: 39.99,
    imageUrl: "https://images.unsplash.com/photo-1506629905877-52a5ca6d63b1?w=500",
    category: "Women",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Kids' Backpack",
    description: "Colorful and durable backpack for school or travel.",
    price: 29.99,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    category: "Kids",
    sizes: ["One Size"]
  },
  {
    name: "Men's Sports Shorts",
    description: "Breathable sports shorts with moisture-wicking technology.",
    price: 34.99,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Women's Blouse",
    description: "Elegant blouse with delicate patterns and comfortable fit.",
    price: 54.99,
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500",
    category: "Women",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Kids' Sneakers",
    description: "Comfortable and colorful sneakers for active kids.",
    price: 39.99,
    imageUrl: "https://images.unsplash.com/photo-1560769624-7f8f6ab32eb3?w=500",
    category: "Kids",
    sizes: ["S", "M", "L"]
  },
  {
    name: "Men's Winter Beanie",
    description: "Warm and stylish beanie for cold weather protection.",
    price: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=500",
    category: "Men",
    sizes: ["One Size"]
  },
  {
    name: "Women's Scarf",
    description: "Soft and warm scarf with beautiful patterns.",
    price: 24.99,
    imageUrl: "https://images.unsplash.com/photo-1544441893-675973e31985?w=500",
    category: "Women",
    sizes: ["One Size"]
  },
  {
    name: "Kids' Baseball Cap",
    description: "Adjustable baseball cap with fun designs for kids.",
    price: 14.99,
    imageUrl: "https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=500",
    category: "Kids",
    sizes: ["One Size"]
  },
  {
    name: "Men's Swim Trunks",
    description: "Quick-dry swim trunks with secure pockets.",
    price: 29.99,
    imageUrl: "https://images.unsplash.com/photo-1505872342447-0f1c6cff6bfb?w=500",
    category: "Men",
    sizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Women's Summer Hat",
    description: "Wide-brimmed hat for sun protection during summer.",
    price: 34.99,
    imageUrl: "https://images.unsplash.com/photo-1534215754738-0a2c5ab2416e?w=500",
    category: "Women",
    sizes: ["One Size"]
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany();
    logger.info('Cleared existing products');

    // Insert new products
    await Product.insertMany(products);
    logger.info(`Seeded ${products.length} products successfully`);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding products:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedProducts();
}

module.exports = seedProducts;