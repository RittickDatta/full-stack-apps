
import assert from "node:assert/strict";
import test from "node:test";

import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeSchema,
  sendMessageSchema,
  startRoomSchema,
} from "../dist/index.js";

test("normalizes lowercase room codes", () => {
  const result = roomCodeSchema.parse("a7k9pq");

  assert.equal(result, "A7K9PQ");
});

test("rejects invalid room codes", () => {
  assert.equal(
    roomCodeSchema.safeParse("123").success,
    false,
  );

  assert.equal(
    roomCodeSchema.safeParse("A7K9P0").success,
    false,
  );
});

test("trims display names", () => {
  const result = createRoomSchema.parse({
    displayName: "  Alice  ",
  });

  assert.equal(result.displayName, "Alice");
});

test("rejects whitespace-only display names", () => {
  const result = createRoomSchema.safeParse({
    displayName: "    ",
  });

  assert.equal(result.success, false);
});

test("rejects client-assigned roles", () => {
  const result = joinRoomSchema.safeParse({
    roomCode: "A7K9PQ",
    displayName: "Alice",
    role: "creator",
  });

  assert.equal(result.success, false);
});

test("rejects empty messages", () => {
  const result = sendMessageSchema.safeParse({
    roomCode: "A7K9PQ",
    content: "   ",
  });

  assert.equal(result.success, false);
});

test("accepts valid multiline messages", () => {
  const result = sendMessageSchema.parse({
    roomCode: "A7K9PQ",
    content: "Hello\nRoomChat!",
  });

  assert.equal(result.content, "Hello\nRoomChat!");
});

test("rejects invalid creator tokens", () => {
  const result = startRoomSchema.safeParse({
    roomCode: "A7K9PQ",
    creatorToken: "short",
  });

  assert.equal(result.success, false);
});
