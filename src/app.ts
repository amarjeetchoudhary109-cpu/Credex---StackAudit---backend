import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { apiRoutes } from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";

dotenv.config();

const app = express();

/** Browsers send Origin without a trailing slash — normalize so allowlists match. */
function normalizeOriginUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const u = new URL(raw.trim());
    u.pathname = "";
    u.search = "";
    u.hash = "";
    return u.origin;
  } catch {
    const s = raw.trim().replace(/\/+$/, "");
    return s || null;
  }
}

function buildAllowedOrigins(): Set<string> {
  const pieces = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    process.env.CORS_ORIGINS,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://credex-stackaudit-production.up.railway.app",
    "https://credex-stackaudit-production.up.railway.app"
  ]
    .filter(Boolean)
    .flatMap((s) => String(s).split(","))
    .map((s) => normalizeOriginUrl(s.trim()))
    .filter((o): o is string => Boolean(o));
  return new Set(pieces);
}

const allowedOrigins = buildAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = normalizeOriginUrl(origin);
      if (normalized && allowedOrigins.has(normalized)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
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
