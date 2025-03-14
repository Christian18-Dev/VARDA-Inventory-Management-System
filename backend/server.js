require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ Improved CORS Configuration
const allowedOrigins = [
  "https://christian18-dev.github.io/VARDA-Inventory-Management-System/",
  "http://localhost:3001"// Allow local testing

];

app.use(express.json());
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas via Mongoose");

    const client = new MongoClient(mongoURI);
    return client.connect();
  })
  .then((client) => {
    app.locals.db = client.db(); // Save DB instance

    console.log("✅ Native MongoDB client connected");

    // ✅ Routes
    app.use("/api/inventory", require("./routes/InventoryRoutes"));
    app.use("/api/dashboard", require("./routes/DashboardRoutes"));
    app.use("/api/auth", require("./routes/AuthRoutes"));
    app.use("/api/history", require("./routes/HistoryRoutes"));

    // ✅ Health Check Route (New)
    app.get("/", (req, res) => res.send("✅ API is running"));

    // ✅ Start Server
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });
