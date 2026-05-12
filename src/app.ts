import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { apiRoutes } from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://credex-stackaudit-production.up.railway.app/",
    ],
    credentials: true,
  })
);

app.use((req, _res, next) => {
  if (req.originalUrl.startsWith("/api")) {
    console.log(`[→in] ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use(requestLogger);

/** Lead submissions may include a base64 audit PDF (same as client download). */
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", apiRoutes);

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Credex API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use(errorHandler);

export { app };
