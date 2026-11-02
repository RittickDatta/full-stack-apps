import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "chatroom-server",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});
