
export interface RateLimitPolicy {
  maxRequests: number;
  windowMs: number;
}

function positiveIntegerFromEnv(
  name: string,
  fallback: number,
): number {
  const raw = process.env[name];

  if (raw === undefined) {
    return fallback;
  }

  const value = Number(raw);

  if (
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${name} must be a positive integer`,
    );
  }

  return value;
}

export const RATE_LIMITS = {
  roomCreate: {
    maxRequests: positiveIntegerFromEnv(
      "RATE_LIMIT_ROOM_CREATE",
      5,
    ),
    windowMs: 10 * 60 * 1000,
  },

  roomJoin: {
    maxRequests: positiveIntegerFromEnv(
      "RATE_LIMIT_ROOM_JOIN",
      15,
    ),
    windowMs: 60 * 1000,
  },

  chatSend: {
    maxRequests: positiveIntegerFromEnv(
      "RATE_LIMIT_CHAT_SEND",
      10,
    ),
    windowMs: 5 * 1000,
  },
} satisfies Record<string, RateLimitPolicy>;
