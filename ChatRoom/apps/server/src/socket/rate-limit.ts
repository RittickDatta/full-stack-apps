
import type { Socket } from "socket.io";

import type {
  RateLimitPolicy,
} from "../config/rate-limits.js";

import {
  RateLimitService,
} from "../services/rate-limit.service.js";

export const rateLimitService =
  new RateLimitService();

export function getSocketIp(
  socket: Socket,
): string {
  return socket.handshake.address;
}

export function consumeSocketRateLimit(
  socket: Socket,
  action: string,
  policy: RateLimitPolicy,
  identity?: string,
) {
  const key = [
    action,
    identity ?? getSocketIp(socket),
  ].join(":");

  return rateLimitService.consume(
    key,
    policy,
  );
}
