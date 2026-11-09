
import assert from "node:assert/strict";
import test from "node:test";

import {
  RateLimitService,
} from "../dist/services/rate-limit.service.js";

test("allows requests within the configured limit", () => {
  let now = 1_000;

  const limiter = new RateLimitService(() => now);

  const policy = {
    maxRequests: 3,
    windowMs: 10_000,
  };

  const first = limiter.consume("user:1", policy);
  const second = limiter.consume("user:1", policy);
  const third = limiter.consume("user:1", policy);

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 2);

  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 1);

  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);
});

test("rejects requests above the limit", () => {
  const limiter = new RateLimitService(() => 1_000);

  const policy = {
    maxRequests: 2,
    windowMs: 5_000,
  };

  limiter.consume("user:1", policy);
  limiter.consume("user:1", policy);

  const rejected = limiter.consume("user:1", policy);

  assert.equal(rejected.allowed, false);
  assert.equal(rejected.remaining, 0);
  assert.equal(rejected.retryAfterMs, 5_000);
});

test("resets the limit after the window expires", () => {
  let now = 1_000;

  const limiter = new RateLimitService(() => now);

  const policy = {
    maxRequests: 1,
    windowMs: 5_000,
  };

  assert.equal(
    limiter.consume("user:1", policy).allowed,
    true,
  );

  assert.equal(
    limiter.consume("user:1", policy).allowed,
    false,
  );

  now = 6_000;

  const result = limiter.consume("user:1", policy);

  assert.equal(result.allowed, true);
  assert.equal(result.remaining, 0);
});

test("maintains separate counters for different keys", () => {
  const limiter = new RateLimitService(() => 1_000);

  const policy = {
    maxRequests: 1,
    windowMs: 5_000,
  };

  assert.equal(
    limiter.consume("alice", policy).allowed,
    true,
  );

  assert.equal(
    limiter.consume("alice", policy).allowed,
    false,
  );

  assert.equal(
    limiter.consume("bob", policy).allowed,
    true,
  );
});

test("cleanup removes expired entries", () => {
  let now = 1_000;

  const limiter = new RateLimitService(() => now);

  const policy = {
    maxRequests: 2,
    windowMs: 5_000,
  };

  limiter.consume("alice", policy);
  limiter.consume("bob", policy);

  assert.equal(limiter.size, 2);

  now = 6_000;

  const removed = limiter.cleanup();

  assert.equal(removed, 2);
  assert.equal(limiter.size, 0);
});
