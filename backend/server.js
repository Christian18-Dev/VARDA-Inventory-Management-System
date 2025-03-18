require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoClient } = require("mongodb");

// ✅ Import Routes
const AuthRoutes = require("./routes/AuthRoutes");
const InventoryRoutes = require("./routes/InventoryRoutes");
const DashboardRoutes = require("./routes/DashboardRoutes");
const HistoryRoutes = require("./routes/HistoryRoutes");
const activityRoutes = require("./routes/ActivityRoutes");

const app = express();
const PORT = process.env.PORT || 10000;
const mongoURI = process.env.MONGO_URI;

console.log(`🔧 Using PORT: ${PORT}`);
console.log(`🔧 Using MongoDB URI: ${mongoURI ? "✅ Loaded" : "❌ Not Found"}`);

// ✅ Improved CORS Configuration
const allowedOrigins = [
  "https://christian18-dev.github.io",
  "http://localhost:3001", // Allow local testing
];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked CORS request from: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ MongoDB Connection
async function connectDB() {
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB Atlas via Mongoose");

    const client = new MongoClient(mongoURI);
    await client.connect();
    app.locals.db = client.db();
    console.log("✅ Native MongoDB client connected");

    startServer();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Stop server if DB fails
  }
}

// ✅ Routes Setup
app.use("/api/inventory", InventoryRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/history", HistoryRoutes);
app.use("/api/auth", require("./routes/AuthRoutes"));
app.use("/api/activitylogs", activityRoutes);

// ✅ Debug: Ensure Login Route Works
app.post("/api/auth/login", (req, res, next) => {
  console.log("🔹 Login API Hit:", req.body);
  next();
});

// ✅ Health Check Route
app.get("/", (req, res) => res.send("✅ API is running"));

// ✅ Start Express Server
function startServer() {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// 🔥 Connect to Database & Start Server
connectDB();
