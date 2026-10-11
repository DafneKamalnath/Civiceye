import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import reportRoutes from "./routes/reports.js";
import statsRoutes from "./routes/stats.js";

const app = express();

// CORS configuration limited to CLIENT_URL
const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || origin === allowedOrigin || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "civiceye-server",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stats", statsRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.name || "AppError"}:`, err.message);

  const statusCode = err.statusCode || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);
  res.status(statusCode).json({
    message: err.message || "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

export default app;
