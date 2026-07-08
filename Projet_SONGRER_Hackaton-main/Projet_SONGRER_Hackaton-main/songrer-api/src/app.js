import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import organizationRoutes from "./routes/organizations.js";
import reportRoutes from "./routes/reports.js";
import statisticRoutes from "./routes/statistics.js";
import videoRoutes from "./routes/videos.js";
import { errorHandler, notFound } from "./middleware/error.js";

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origine CORS non autorisee."));
  },
  credentials: true
}));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "songrer-api" });
});

app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/organizations", organizationRoutes);
app.use("/reports", reportRoutes);
app.use("/statistics", statisticRoutes);
app.use("/videos", videoRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
