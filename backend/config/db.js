const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    conn.connection.on("error", (err) => {
      console.error("❌ MongoDB runtime error:", err.message);
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}:${conn.connection.port}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
