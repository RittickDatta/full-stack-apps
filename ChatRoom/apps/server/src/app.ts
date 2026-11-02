import express from "express";
import cors from "cors";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);

app.use(express.json({ limit: "16kb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "ChatRoom API",
    version: "0.1.0",
    status: "running",
  });
});

app.use("/api/health", healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
