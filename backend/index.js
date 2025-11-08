import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
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

const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    // Check and refresh API keys on startup
    await ThyrocareRefreshService.checkAndRefreshOnStartup();
  })
  .catch((err) => console.log("MongoDB Connection Error: ", err));

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/client', clientRouter);
app.use('/api/cart', cartRouter);
app.use('/api/beneficiaries', beneficiaryRouter);
app.use('/api/settings', SiteSettingsRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running fine",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});

app.listen(PORT, () => {
  console.log(`backend is listening to port ${PORT}`);
});
