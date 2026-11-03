
import assert from "node:assert/strict";
import test from "node:test";

import {
  ROOM_CODE_CHARACTERS,
  ROOM_CODE_LENGTH,
} from "@chatroom/shared";

import {
  InMemoryRoomRepository,
} from "../dist/repositories/in-memory-room.repository.js";

import {
  RoomService,
} from "../dist/services/room.service.js";

import {
  generateRoomCode,
} from "../dist/services/room-code.js";

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
      assert.ok(
        ROOM_CODE_CHARACTERS.includes(character),
      );
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
  assert.equal(
    verifyCreatorToken("incorrect-token", hash),
    false,
  );
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

  const room = repository.findByCode(
    result.data.room.code,
  );

  assert.ok(room);
  assert.equal(room.participants.size, 1);

  const creator = Array.from(
    room.participants.values(),
  )[0];

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

  const room = repository.findByCode(
    result.data.room.code,
  );

  assert.ok(room);

  assert.notEqual(
    room.creatorTokenHash,
    result.data.creatorToken,
  );

  assert.equal(
    verifyCreatorToken(
      result.data.creatorToken,
      room.creatorTokenHash,
    ),
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

  assert.equal(
    Object.hasOwn(
      result.data.room,
      "creatorToken",
    ),
    false,
  );
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

  assert.notEqual(
    first.data.room.code,
    second.data.room.code,
  );

  assert.equal(repository.count(), 2);
});
