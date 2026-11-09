
import type {
  RateLimitPolicy,
} from "../config/rate-limits.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export class RateLimitService {
  private readonly entries = new Map<
    string,
    RateLimitEntry
  >();

  constructor(
    private readonly now: () => number = Date.now,
  ) {}

  consume(
    key: string,
    policy: RateLimitPolicy,
  ): RateLimitResult {
    const currentTime = this.now();
    const existing = this.entries.get(key);

    if (
      !existing ||
      currentTime >= existing.resetAt
    ) {
      this.entries.set(key, {
        count: 1,
        resetAt: currentTime + policy.windowMs,
      });

      return {
        allowed: true,
        remaining: policy.maxRequests - 1,
        retryAfterMs: 0,
      };
    }

    if (existing.count >= policy.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs:
          existing.resetAt - currentTime,
      };
    }

    existing.count += 1;

    return {
      allowed: true,
      remaining:
        policy.maxRequests - existing.count,
      retryAfterMs: 0,
    };
  }

  cleanup(): number {
    const currentTime = this.now();
    let removed = 0;

    for (const [key, entry] of this.entries) {
      if (currentTime >= entry.resetAt) {
        this.entries.delete(key);
        removed += 1;
      }
    }

    return removed;
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
