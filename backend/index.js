import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import "dotenv/config";
import authRouter from "./src/routes/auth.js";
import userRouter from "./src/routes/user.js";
import adminRouter from "./src/routes/admin.js";
import clientRouter from "./src/routes/client.js";
import cartRouter from "./src/routes/cart.js";
import SiteSettingsRouter from "./src/routes/siteSettings.js";
import beneficiaryRouter from "./src/routes/beneficiary.js";
import ThyrocareRefreshService from "./src/services/thyrocareRefreshService.js";

const app = express();

// --- Env validation ---
["MONGODB_URI", "CLIENT_URLS"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

console.log("Allowed origins:", process.env.CLIENT_URLS);
// --- Middleware ---
const allowedOrigins = process.env.CLIENT_URLS.split(",");
app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
  credentials: true,
}));

app.use(helmet());
app.use(compression());
app.use(express.json());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- Routes ---
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/client", clientRouter);
app.use("/api/cart", cartRouter);
app.use("/api/beneficiaries", beneficiaryRouter);
app.use("/api/settings", SiteSettingsRouter);

// --- Health check route ---
app.get("/", (req, res) => res.json({ success: true, message: "API is running fine", timestamp: new Date().toISOString() }));

// --- Error handling ---
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: "Not Found" }));

// --- Database + startup ---
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await ThyrocareRefreshService.checkAndRefreshOnStartup();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- Graceful shutdown ---
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
