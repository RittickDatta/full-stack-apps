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


function setupActiveRoom() {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });

  assert.equal(created.success, true);

  const started = service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  });

  assert.equal(started.success, true);

  return {
    repository,
    service,
    roomCode: created.data.room.code,
    creatorId: started.data.participantId,
  };
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


test("joins an active room successfully", () => {
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

  const joined = service.joinRoom({
    roomCode: created.data.room.code,
    displayName: "Bob",
  });

  assert.equal(joined.success, true);
  if (!joined.success) return;

  assert.equal(joined.data.room.status, "active");
  assert.equal(joined.data.room.participantCount, 2);

  const participant = repository.findParticipant(
    created.data.room.code,
    joined.data.participantId,
  );

  assert.equal(participant?.displayName, "Bob");
  assert.equal(participant?.role, "member");
});

test("rejects joining a room that has not started", () => {
  const { service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });
  assert.equal(created.success, true);
  if (!created.success) return;

  const joined = service.joinRoom({
    roomCode: created.data.room.code,
    displayName: "Bob",
  });

  assert.equal(joined.success, false);
  if (joined.success) return;

  assert.equal(joined.error.code, "ROOM_NOT_ACTIVE");
});

test("rejects joining a nonexistent room", () => {
  const { service } = setup();

  const result = service.joinRoom({
    roomCode: "A7K9PQ",
    displayName: "Bob",
  });

  assert.equal(result.success, false);
  if (result.success) return;

  assert.equal(result.error.code, "ROOM_NOT_FOUND");
});

test("rejects invalid join payloads", () => {
  const { service } = setup();

  const result = service.joinRoom({
    roomCode: "INVALID",
    displayName: " ",
  });

  assert.equal(result.success, false);
  if (result.success) return;

  assert.equal(result.error.code, "INVALID_PAYLOAD");
});

test("rejects joining a full room", () => {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });
  assert.equal(created.success, true);
  if (!created.success) return;

  const code = created.data.room.code;

  const started = service.startRoom({
    roomCode: code,
    creatorToken: created.data.creatorToken,
  });
  assert.equal(started.success, true);

  const room = repository.findByCode(code);
  assert.ok(room);

  // The creator already occupies one place.
  for (let i = 1; i < room.maxParticipants; i++) {
    const result = service.joinRoom({
      roomCode: code,
      displayName: `Member ${i}`,
    });

    assert.equal(result.success, true);
  }

  const extra = service.joinRoom({
    roomCode: code,
    displayName: "Extra Member",
  });

  assert.equal(extra.success, false);
  if (extra.success) return;

  assert.equal(extra.error.code, "ROOM_FULL");

  assert.equal(
    repository.findByCode(code)?.participants.size,
    room.maxParticipants,
  );
});

test("normalizes lowercase room codes on join", () => {
  const { service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });
  assert.equal(created.success, true);
  if (!created.success) return;

  service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  });

  const joined = service.joinRoom({
    roomCode: created.data.room.code.toLowerCase(),
    displayName: "Bob",
  });

  assert.equal(joined.success, true);
});

test("rejects joining a locked room", () => {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });
  assert.equal(created.success, true);
  if (!created.success) return;

  const code = created.data.room.code;

  service.startRoom({
    roomCode: code,
    creatorToken: created.data.creatorToken,
  });

  repository.updateStatus(code, "locked");

  const joined = service.joinRoom({
    roomCode: code,
    displayName: "Bob",
  });

  assert.equal(joined.success, false);
  if (joined.success) return;

  assert.equal(joined.error.code, "ROOM_LOCKED");
});

test("rejects joining a closed room", () => {
  const { repository, service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });
  assert.equal(created.success, true);
  if (!created.success) return;

  const code = created.data.room.code;

  repository.updateStatus(code, "closed");

  const joined = service.joinRoom({
    roomCode: code,
    displayName: "Bob",
  });

  assert.equal(joined.success, false);
  if (joined.success) return;

  assert.equal(joined.error.code, "ROOM_CLOSED");
});

test("join response does not expose creator credentials", () => {
  const { service } = setup();

  const created = service.createRoom({
    displayName: "Alice",
  });
  assert.equal(created.success, true);
  if (!created.success) return;

  service.startRoom({
    roomCode: created.data.room.code,
    creatorToken: created.data.creatorToken,
  });

  const joined = service.joinRoom({
    roomCode: created.data.room.code,
    displayName: "Bob",
  });

  assert.equal(joined.success, true);
  if (!joined.success) return;

  assert.equal(
    Object.hasOwn(joined.data.room, "creatorToken"),
    false,
  );

  assert.equal(
    Object.hasOwn(joined.data.room, "creatorTokenHash"),
    false,
  );
});


test("sends and stores a valid chat message", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const result = service.sendMessage(
    {
      roomCode,
      content: "Hello everyone!",
    },
    creatorId,
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.type, "chat");
  assert.equal(result.data.content, "Hello everyone!");
  assert.equal(result.data.senderId, creatorId);
  assert.equal(result.data.senderName, "Alice");
  assert.equal(result.data.roomCode, roomCode);

  assert.ok(result.data.id);
  assert.ok(result.data.createdAt);

  const messages = repository.getMessages(roomCode);

  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, result.data.id);
});


test("rejects whitespace-only messages", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const result = service.sendMessage(
    {
      roomCode,
      content: "   ",
    },
    creatorId,
  );

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "INVALID_PAYLOAD");
  assert.equal(repository.getMessages(roomCode).length, 0);
});


test("rejects messages exceeding the maximum length", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const result = service.sendMessage(
    {
      roomCode,
      content: "A".repeat(2001),
    },
    creatorId,
  );

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "INVALID_PAYLOAD");
  assert.equal(repository.getMessages(roomCode).length, 0);
});


test("rejects messages without a participant ID", () => {
  const {
    service,
    roomCode,
  } = setupActiveRoom();

  const result = service.sendMessage(
    {
      roomCode,
      content: "Hello!",
    },
    undefined,
  );

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "NOT_AUTHORIZED");
});


test("rejects unknown participants", () => {
  const {
    service,
    roomCode,
  } = setupActiveRoom();

  const result = service.sendMessage(
    {
      roomCode,
      content: "Hello!",
    },
    "unknown-participant",
  );

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(
    result.error.code,
    "PARTICIPANT_NOT_FOUND",
  );
});


test("allows existing participants to chat in locked rooms", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  repository.updateStatus(roomCode, "locked");

  const result = service.sendMessage(
    {
      roomCode,
      content: "We can still chat.",
    },
    creatorId,
  );

  assert.equal(result.success, true);
});


test("rejects messages in closed rooms", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  repository.updateStatus(roomCode, "closed");

  const result = service.sendMessage(
    {
      roomCode,
      content: "Can anyone hear me?",
    },
    creatorId,
  );

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(result.error.code, "ROOM_CLOSED");
});


test("includes saved messages in later room snapshots", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  service.sendMessage(
    {
      roomCode,
      content: "First message",
    },
    creatorId,
  );

  service.sendMessage(
    {
      roomCode,
      content: "Second message",
    },
    creatorId,
  );

  const snapshot = repository.findByCode(roomCode);

  assert.ok(snapshot);
  assert.equal(snapshot.messages.length, 2);
  assert.equal(
    snapshot.messages[0].content,
    "First message",
  );
  assert.equal(
    snapshot.messages[1].content,
    "Second message",
  );
});


test("trims message content before saving", () => {
  const {
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const result = service.sendMessage(
    {
      roomCode,
      content: "   Hello Bob!   ",
    },
    creatorId,
  );

  assert.equal(result.success, true);

  if (!result.success) return;

  assert.equal(result.data.content, "Hello Bob!");
});



test("cannot send using another room's participant ID", () => {
  const { service } = setup();

  const first = service.createRoom({
    displayName: "Alice",
  });

  const second = service.createRoom({
    displayName: "Bob",
  });

  assert.equal(first.success, true);
  assert.equal(second.success, true);

  const startedFirst = service.startRoom({
    roomCode: first.data.room.code,
    creatorToken: first.data.creatorToken,
  });

  const startedSecond = service.startRoom({
    roomCode: second.data.room.code,
    creatorToken: second.data.creatorToken,
  });

  assert.equal(startedFirst.success, true);
  assert.equal(startedSecond.success, true);

  const result = service.sendMessage(
    {
      roomCode: second.data.room.code,
      content: "I should not be here.",
    },
    startedFirst.data.participantId,
  );

  assert.equal(result.success, false);

  if (result.success) return;

  assert.equal(
    result.error.code,
    "PARTICIPANT_NOT_FOUND",
  );
});


test("marks a participant offline", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const snapshot = service.setParticipantPresence(
    roomCode,
    creatorId,
    false,
  );

  assert.ok(snapshot);

  const participant = snapshot.participants.find(
    (item) => item.id === creatorId,
  );

  assert.equal(participant?.isConnected, false);

  const stored = repository.findParticipant(
    roomCode,
    creatorId,
  );

  assert.equal(stored?.isConnected, false);
});


test("marks an offline participant online", () => {
  const {
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  service.setParticipantPresence(
    roomCode,
    creatorId,
    false,
  );

  const snapshot = service.setParticipantPresence(
    roomCode,
    creatorId,
    true,
  );

  assert.ok(snapshot);

  const participant = snapshot.participants.find(
    (item) => item.id === creatorId,
  );

  assert.equal(participant?.isConnected, true);
});


test("does not update presence for unknown participants", () => {
  const { service, roomCode } = setupActiveRoom();

  const result = service.setParticipantPresence(
    roomCode,
    "unknown-participant",
    false,
  );

  assert.equal(result, null);
});


test("does not update presence for unknown rooms", () => {
  const { service } = setup();

  const result = service.setParticipantPresence(
    "A7K9PQ",
    "participant-123",
    false,
  );

  assert.equal(result, null);
});


test("presence updates preserve participant identity", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const before = repository.findParticipant(
    roomCode,
    creatorId,
  );

  service.setParticipantPresence(
    roomCode,
    creatorId,
    false,
  );

  const after = repository.findParticipant(
    roomCode,
    creatorId,
  );

  assert.ok(before);
  assert.ok(after);

  assert.equal(after.id, before.id);
  assert.equal(after.displayName, before.displayName);
  assert.equal(after.role, before.role);
  assert.equal(after.joinedAt, before.joinedAt);
  assert.equal(after.isConnected, false);
});


test("offline participants remain in the room", () => {
  const {
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const before = service.getRoomSnapshot(roomCode);

  const after = service.setParticipantPresence(
    roomCode,
    creatorId,
    false,
  );

  assert.ok(before);
  assert.ok(after);

  assert.equal(
    after.participantCount,
    before.participantCount,
  );

  assert.equal(
    after.participants.length,
    before.participants.length,
  );
});


test("presence snapshots exclude creator credentials", () => {
  const {
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  const snapshot = service.setParticipantPresence(
    roomCode,
    creatorId,
    false,
  );

  assert.ok(snapshot);

  assert.equal(
    Object.hasOwn(snapshot, "creatorToken"),
    false,
  );

  assert.equal(
    Object.hasOwn(snapshot, "creatorTokenHash"),
    false,
  );
});


test("closed rooms reject presence updates", () => {
  const {
    repository,
    service,
    roomCode,
    creatorId,
  } = setupActiveRoom();

  repository.updateStatus(roomCode, "closed");

  const result = service.setParticipantPresence(
    roomCode,
    creatorId,
    false,
  );

  assert.equal(result, null);
});

