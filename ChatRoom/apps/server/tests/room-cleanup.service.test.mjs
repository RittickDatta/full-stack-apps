import test from "node:test";
import assert from "node:assert/strict";

import { InMemoryRoomRepository } from "../dist/repositories/in-memory-room.repository.js";

import { RoomService } from "../dist/services/room.service.js";

import { RoomCleanupService } from "../dist/services/room-cleanup.service.js";

const MINUTE = 60 * 1000;

const config = {
  unstartedRoomTtlMs: 15 * MINUTE,
  emptyRoomTtlMs: 30 * MINUTE,
  closedRoomTtlMs: 5 * MINUTE,
  cleanupIntervalMs: MINUTE,
};

function setup() {
  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  let currentTime = Date.now();

  const cleanup = new RoomCleanupService(repository, config, () => currentTime);

  return {
    repository,
    service,
    cleanup,
    advanceTime(ms) {
      currentTime += ms;
    },
    now() {
      return currentTime;
    },
  };
}

function createRoom(service) {
  const result = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(result.success, true);

  if (!result.success) {
    throw new Error("Room creation failed");
  }

  return result.data;
}

function startRoom(service, created) {
  const result = service.startRoom({
    roomCode: created.room.code,
    creatorToken: created.creatorToken,
  });

  assert.equal(result.success, true);

  return result;
}

test("unstarted rooms expire after 15 minutes", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  ctx.advanceTime(14 * MINUTE);

  assert.deepEqual(ctx.cleanup.cleanupExpiredRooms(), []);

  assert.ok(ctx.repository.findByCode(created.room.code));

  ctx.advanceTime(2 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.equal(expired.length, 1);
  assert.equal(expired[0].reason, "unstarted");

  assert.equal(ctx.repository.findByCode(created.room.code), null);
});

test("connected active rooms do not expire", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  startRoom(ctx.service, created);

  ctx.advanceTime(120 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.deepEqual(expired, []);

  assert.ok(ctx.repository.findByCode(created.room.code));
});

test("empty active rooms expire after 30 minutes", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  const started = startRoom(ctx.service, created);

  assert.equal(started.success, true);
  if (!started.success) return;

  const roomCode = created.room.code;

  ctx.service.leaveRoom({ roomCode }, started.data.participantId);

  const room = ctx.repository.findByCode(roomCode);

  assert.ok(room);

  // Align the timestamp with the injected test clock.
  room.emptySince = new Date(ctx.now()).toISOString();

  ctx.advanceTime(29 * MINUTE);

  assert.equal(ctx.cleanup.cleanupExpiredRooms().length, 0);

  ctx.advanceTime(2 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.equal(expired.length, 1);
  assert.equal(expired[0].reason, "empty");
  assert.equal(ctx.repository.findByCode(roomCode), null);
});

test("joining an empty room cancels expiration", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  const started = startRoom(ctx.service, created);

  assert.equal(started.success, true);
  if (!started.success) return;

  const roomCode = created.room.code;

  ctx.service.leaveRoom({ roomCode }, started.data.participantId);

  const room = ctx.repository.findByCode(roomCode);
  assert.ok(room);

  room.emptySince = new Date(ctx.now()).toISOString();

  ctx.advanceTime(20 * MINUTE);

  const joined = ctx.service.joinRoom({
    roomCode,
    displayName: "Bob",
  });

  assert.equal(joined.success, true);

  ctx.advanceTime(40 * MINUTE);

  assert.deepEqual(ctx.cleanup.cleanupExpiredRooms(), []);

  assert.ok(ctx.repository.findByCode(roomCode));
});

test("closed rooms expire after five minutes", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  startRoom(ctx.service, created);

  const closed = ctx.service.closeRoom({
    roomCode: created.room.code,
    creatorToken: created.creatorToken,
  });

  assert.equal(closed.success, true);

  const room = ctx.repository.findByCode(created.room.code);

  assert.ok(room);

  room.closedAt = new Date(ctx.now()).toISOString();

  ctx.advanceTime(4 * MINUTE);

  assert.equal(ctx.cleanup.cleanupExpiredRooms().length, 0);

  ctx.advanceTime(2 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.equal(expired.length, 1);
  assert.equal(expired[0].reason, "closed");
});

test("empty locked rooms expire", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  const started = startRoom(ctx.service, created);

  assert.equal(started.success, true);
  if (!started.success) return;

  const roomCode = created.room.code;

  const locked = ctx.service.lockRoom({
    roomCode,
    creatorToken: created.creatorToken,
  });

  assert.equal(locked.success, true);

  ctx.service.leaveRoom({ roomCode }, started.data.participantId);

  const room = ctx.repository.findByCode(roomCode);
  assert.ok(room);

  room.emptySince = new Date(ctx.now()).toISOString();

  ctx.advanceTime(31 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.equal(expired.length, 1);
  assert.equal(expired[0].reason, "empty");
});

test("cleanup removes multiple expired rooms", () => {
  const ctx = setup();

  const first = createRoom(ctx.service);
  const second = createRoom(ctx.service);
  const third = createRoom(ctx.service);

  ctx.advanceTime(16 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.equal(expired.length, 3);
  assert.equal(ctx.repository.count(), 0);

  for (const created of [first, second, third]) {
    assert.equal(ctx.repository.findByCode(created.room.code), null);
  }
});

test("cleanup can run repeatedly without errors", () => {
  const ctx = setup();

  createRoom(ctx.service);

  ctx.advanceTime(16 * MINUTE);

  assert.equal(ctx.cleanup.cleanupExpiredRooms().length, 1);

  assert.deepEqual(ctx.cleanup.cleanupExpiredRooms(), []);
});

test("cleanup preserves rooms that have not expired", () => {
  const ctx = setup();

  const created = createRoom(ctx.service);

  ctx.advanceTime(5 * MINUTE);

  assert.deepEqual(ctx.cleanup.cleanupExpiredRooms(), []);

  assert.ok(ctx.repository.findByCode(created.room.code));
});

test("offline participants do not prevent room expiration", () => {
  const ctx = setup();
  const created = createRoom(ctx.service);

  const started = startRoom(ctx.service, created);

  assert.equal(started.success, true);
  if (!started.success) return;

  const roomCode = created.room.code;

  ctx.service.setParticipantPresence(
    roomCode,
    started.data.participantId,
    false,
  );

  const room = ctx.repository.findByCode(roomCode);
  assert.ok(room);

  assert.equal(room.participants.size, 1);

  room.emptySince = new Date(ctx.now()).toISOString();

  ctx.advanceTime(31 * MINUTE);

  const expired = ctx.cleanup.cleanupExpiredRooms();

  assert.equal(expired.length, 1);
  assert.equal(expired[0].reason, "empty");
});
