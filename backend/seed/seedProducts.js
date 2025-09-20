// run: npm run seed
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const Product = require("../models/Product");

const products = [
  { name: "Classic Tee", description: "Soft cotton t-shirt", price: 19.99, imageUrl: "", category: "Men", sizes: ["S","M","L","XL"] },
  { name: "Slim Jeans", description: "Comfort stretch denim", price: 49.99, imageUrl: "", category: "Men", sizes: ["M","L","XL"] },
  { name: "Hooded Sweatshirt", description: "Cozy hoodie", price: 39.99, imageUrl: "", category: "Men", sizes: ["S","M","L","XL"] },
  { name: "Puffer Jacket", description: "Warm insulated jacket", price: 99.99, imageUrl: "", category: "Women", sizes: ["S","M","L"] },
  { name: "Summer Dress", description: "Lightweight dress", price: 59.99, imageUrl: "", category: "Women", sizes: ["S","M","L"] },
  { name: "Denim Jacket", description: "Stylish jacket", price: 89.99, imageUrl: "", category: "Women", sizes: ["S","M","L","XL"] },
  { name: "Kids Tee", description: "Kids cotton tee", price: 14.99, imageUrl: "", category: "Kids", sizes: ["S","M","L"] },
  { name: "Kids Hoodie", description: "Warm kids hoodie", price: 29.99, imageUrl: "", category: "Kids", sizes: ["S","M","L"] },
  { name: "Jogger Pants", description: "Casual joggers", price: 34.99, imageUrl: "", category: "Men", sizes: ["M","L","XL"] },
  { name: "Chino Pants", description: "Smart casual", price: 44.99, imageUrl: "", category: "Men", sizes: ["M","L","XL"] },
  { name: "Maxi Dress", description: "Elegant maxi dress", price: 69.99, imageUrl: "", category: "Women", sizes: ["S","M","L"] },
  { name: "Leather Jacket", description: "Premium look", price: 199.99, imageUrl: "", category: "Men", sizes: ["M","L","XL"] },
  { name: "Crop Top", description: "Trendy", price: 24.99, imageUrl: "", category: "Women", sizes: ["S","M"] },
  { name: "Graphic Tee", description: "Printed design", price: 21.99, imageUrl: "", category: "Men", sizes: ["S","M","L"] },
  { name: "Leggings", description: "Stretch fit", price: 29.99, imageUrl: "", category: "Women", sizes: ["S","M","L","XL"] },
  { name: "Windbreaker", description: "Light wind resistance", price: 59.99, imageUrl: "", category: "Men", sizes: ["M","L","XL"] },
  { name: "Bomber Jacket", description: "Classic bomber", price: 119.99, imageUrl: "", category: "Men", sizes: ["M","L","XL"] },
  { name: "Skater Skirt", description: "Casual skirt", price: 34.99, imageUrl: "", category: "Women", sizes: ["S","M","L"] },
  { name: "Kids Jeans", description: "Durable denim", price: 29.99, imageUrl: "", category: "Kids", sizes: ["S","M","L"] },
  { name: "Beanie", description: "Warm knit beanie", price: 12.99, imageUrl: "", category: "Men", sizes: [] }
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/clothing-ecom");
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log("Seeded products");
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
