import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../config/env.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found.",
    },
  });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  console.error("Unhandled server error:", error);

  const message =
    env.NODE_ENV === "production"
      ? "An unexpected server error occurred."
      : error instanceof Error
        ? error.message
        : "Unknown server error";

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  });
};
