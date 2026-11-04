import assert from "node:assert/strict";
import test from "node:test";

import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from "@chatroom/shared";

import { InMemoryRoomRepository } from "../dist/repositories/in-memory-room.repository.js";

import { RoomService } from "../dist/services/room.service.js";

import { generateRoomCode } from "../dist/services/room-code.js";

import {
  generateCreatorToken,
  hashCreatorToken,
  verifyCreatorToken,
} from "../dist/services/creator-token.js";

function setup() {
  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  return { repository, service };
}

test("generates valid room codes", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateRoomCode();

    assert.equal(code.length, ROOM_CODE_LENGTH);

    for (const character of code) {
      assert.ok(ROOM_CODE_CHARACTERS.includes(character));
    }
  }
});

test("generates secure creator tokens", () => {
  const first = generateCreatorToken();
  const second = generateCreatorToken();

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});

test("hashes and verifies creator tokens", () => {
  const token = generateCreatorToken();
  const hash = hashCreatorToken(token);

  assert.notEqual(hash, token);
  assert.equal(verifyCreatorToken(token, hash), true);
  assert.equal(verifyCreatorToken("incorrect-token", hash), false);
});

test("creates a room successfully", () => {
  const { repository, service } = setup();

  const result = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.room.status, "created");
  assert.equal(result.data.room.participantCount, 1);
  assert.equal(repository.count(), 1);
});

test("stores the creator as the first participant", () => {
  const { repository, service } = setup();

  const result = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(result.success, true);

  if (!result.success) return;

  const room = repository.findByCode(result.data.room.code);

  assert.ok(room);
  assert.equal(room.participants.size, 1);

  const creator = Array.from(room.participants.values())[0];

  assert.equal(creator.displayName, "Alice");
  assert.equal(creator.role, "creator");
  assert.equal(creator.id, room.creatorId);
});

test("stores only the creator token hash", () => {
  const { repository, service } = setup();

  const result = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(result.success, true);

  if (!result.success) return;

  const room = repository.findByCode(result.data.room.code);

  assert.ok(room);

  assert.notEqual(room.creatorTokenHash, result.data.creatorToken);

  assert.equal(
    verifyCreatorToken(result.data.creatorToken, room.creatorTokenHash),
    true,
  );
});

test("rejects invalid display names", () => {
  const { repository, service } = setup();

  const result = service.createRoom({
    displayName: " ",
  });

  assert.deepEqual(result, {
    success: false,
    error: {
      code: "INVALID_PAYLOAD",
      message: "Please enter a valid display name.",
    },
  });

  assert.equal(repository.count(), 0);
});

test("rejects unexpected payload fields", () => {
  const { service } = setup();

  const result = service.createRoom({
    displayName: "Alice",
    role: "creator",
  });

  assert.equal(result.success, false);
});

test("does not expose creator token in room summary", () => {
  const { service } = setup();

  const result = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(Object.hasOwn(result.data.room, "creatorToken"), false);
});

test("generates different codes for multiple rooms", () => {
  const { repository, service } = setup();

  const first = service.createRoom({
    displayName: "Alice",
  });

  const second = service.createRoom({
    displayName: "Bob",
  });

  assert.equal(first.success, true);
  assert.equal(second.success, true);

  if (!first.success || !second.success) return;

  assert.notEqual(first.data.room.code, second.data.room.code);

  assert.equal(repository.count(), 2);
});

test("creator can start a newly created room", () => {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  if (!created.success) return;

  const result = service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  });

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.room.status, "active");
  assert.ok(result.data.room.startedAt);
  assert.equal(result.data.room.participantCount, 1);

  const storedRoom = repository.findByCode(created.data.room.code);

  assert.equal(storedRoom?.status, "active");
});

test("room start returns the creator participant ID", () => {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  if (!created.success) return;

  const started = service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  });

  assert.equal(started.success, true);

  if (!started.success) return;

  const room = repository.findByCode(created.data.room.code);

  assert.equal(started.data.participantId, room?.creatorId);
});

test("rejects invalid creator tokens", () => {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  if (!created.success) return;

  const result = service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: generateCreatorToken(),
  });

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "NOT_AUTHORIZED");

  assert.equal(
    repository.findByCode(created.data.room.code)?.status,
    "created",
  );
});

test("rejects starting a nonexistent room", () => {
  const { service } = setup();

  const result = service.startRoom({
    roomCode: "A7K9PQ",
    creatorToken: generateCreatorToken(),
  });

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "ROOM_NOT_FOUND");
});

test("rejects starting an already active room", () => {
  const { service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  if (!created.success) return;

  const payload = {
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  };

  const first = service.startRoom(payload);
  const second = service.startRoom(payload);

  assert.equal(first.success, true);
  assert.equal(second.success, false);

  if (second.success) return;

  assert.equal(second.error.code, "ALREADY_STARTED");
});

test("rejects malformed start requests", () => {
  const { service } = setup();

  const result = service.startRoom({
    roomCode: "invalid",
    creatorToken: "short",
  });

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "INVALID_PAYLOAD");
});

test("room start normalizes lowercase room codes", () => {
  const { service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  if (!created.success) return;

  const started = service.startRoom({
    roomCode: created.data.room.code.toLowerCase(),
    creatorToken: created.data.creatorToken,
  });

  assert.equal(started.success, true);
});

test("room start snapshot excludes private credentials", () => {
  const { service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  if (!created.success) return;

  const started = service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  });

  assert.equal(started.success, true);

  if (!started.success) return;

  assert.equal(Object.hasOwn(started.data.room, "creatorTokenHash"), false);

  assert.equal(Object.hasOwn(started.data.room, "creatorToken"), false);
});
