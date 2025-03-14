require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware - Must come first
app.use(express.json());
app.use(cors({
  origin: ["https://christian18-dev.github.io/VARDA-Inventory-Management-System/"], // Replace with your actual GitHub Pages URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


// MongoDB Atlas URI
const mongoURI = process.env.MONGO_URI;

// Connect Mongoose
mongoose.connect(mongoURI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas via Mongoose");

    // Also connect Native MongoDB Client for resetInventory
    const client = new MongoClient(mongoURI);
    return client.connect();
  })
  .then((client) => {
    // ✅ Save native db instance for use in resetInventory controller
    app.locals.db = client.db(); // You can also specify DB name: client.db("InventoryDB")

    console.log("✅ Native MongoDB client connected");

    // Routes
    const inventoryRoutes = require("./routes/InventoryRoutes");
    const dashboardRoutes = require("./routes/DashboardRoutes");
    const AuthRoutes = require("./routes/AuthRoutes");
    const historyRoutes = require("./routes/HistoryRoutes");

    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/dashboard", dashboardRoutes);
    app.use("/api/auth", AuthRoutes);
    app.use("/api/history", historyRoutes);

    // Start Server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });
