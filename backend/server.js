require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const AuthRoutes = require("./routes/AuthRoutes");
const InventoryRoutes = require("./routes/InventoryRoutes");
const DashboardRoutes = require("./routes/DashboardRoutes");
const HistoryRoutes = require("./routes/HistoryRoutes");
const activityRoutes = require("./routes/ActivityRoutes");

const app = express();
const PORT = process.env.PORT || 10000;
const mongoURI = process.env.MONGO_URI;
const isProd = process.env.NODE_ENV === "production";

// ✅ Logging info
console.log(`🔧 Environment: ${isProd ? "🚀 Production" : "🛠 Development"}`);
console.log(`🔧 Using PORT: ${PORT}`);
console.log(`🔧 Using MongoDB URI: ${mongoURI ? "✅ Loaded" : "❌ Not Found"}`);

// ✅ CORS Configuration 
const allowedOrigins = [
  "https://christian18-dev.github.io",
  "https://vardafoodgroup.com",
  "https://www.vardafoodgroup.com", 
  "http://localhost:3001"
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
    process.exit(1);
  }
}

// ✅ Routes Setup
app.use("/api/auth", AuthRoutes);
app.use("/api/inventory", InventoryRoutes);
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/history", HistoryRoutes);
app.use("/api/activitylogs", activityRoutes);

// ✅ Debug login route (optional logging in dev)
app.post("/api/auth/login", (req, res, next) => {
  if (!isProd) {
    console.log("🔹 Login Request Body:", req.body);
  }
  next();
});

// ✅ Health Check
app.get("/", (req, res) => res.send("✅ API is running"));

// ✅ Start Server
function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

connectDB();
