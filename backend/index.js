import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import "dotenv/config";
import authRouter from "./src/routes/auth.js";
import userRouter from "./src/routes/user.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error: ", err));

const PORT = process.env.PORT || 3000;

app.use("/api/auth", authRouter);
app.use('/api/user', userRouter);

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
