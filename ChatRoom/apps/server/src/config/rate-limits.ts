
export interface RateLimitPolicy {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  roomCreate: {
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  },
  roomJoin: {
    maxRequests: 15,
    windowMs: 60 * 1000,
  },
  chatSend: {
    maxRequests: 10,
    windowMs: 5 * 1000,
  },
} as const satisfies Record<
  string,
  RateLimitPolicy
>;
