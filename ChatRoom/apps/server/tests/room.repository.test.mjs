
import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryRoomRepository,
} from "../dist/repositories/in-memory-room.repository.js";

import {
  toRoomSnapshot,
} from "../dist/repositories/room-record.js";

function createRepository() {
  return new InMemoryRoomRepository();
}

function createRoom(repo, code = "A7K9PQ") {
  return repo.create({
    code,
    creatorId: "creator-1",
    creatorTokenHash: "hashed-token-placeholder",
    maxParticipants: 3,
    createdAt: "2026-01-01T10:00:00.000Z",
  });
}

function makeParticipant(id, role = "member") {
  return {
    id,
    displayName: `User ${id}`,
    role,
    joinedAt: "2026-01-01T10:00:00.000Z",
    isConnected: true,
  };
}

test("creates and retrieves a room", () => {
  const repo = createRepository();

  const created = createRoom(repo);

  assert.equal(created.code, "A7K9PQ");
  assert.equal(created.status, "created");
  assert.equal(repo.count(), 1);

  const found = repo.findByCode("a7k9pq");

  assert.equal(found?.code, "A7K9PQ");
});

test("rejects duplicate room codes", () => {
  const repo = createRepository();

  createRoom(repo);

  assert.throws(
    () => createRoom(repo),
    /already exists/,
  );
});

test("updates room lifecycle state", () => {
  const repo = createRepository();

  createRoom(repo);

  repo.updateStatus(
    "A7K9PQ",
    "active",
    "2026-01-01T10:05:00.000Z",
  );

  const room = repo.findByCode("A7K9PQ");

  assert.equal(room?.status, "active");
  assert.equal(
    room?.startedAt,
    "2026-01-01T10:05:00.000Z",
  );
});

test("rejects invalid room transitions", () => {
  const repo = createRepository();

  createRoom(repo);

  assert.throws(
    () => repo.updateStatus("A7K9PQ", "locked"),
    /Invalid room transition/,
  );
});

test("adds and retrieves participants", () => {
  const repo = createRepository();

  createRoom(repo);
  repo.updateStatus("A7K9PQ", "active");

  const participant = makeParticipant("p1");

  repo.addParticipant("A7K9PQ", participant);

  const found = repo.findParticipant(
    "A7K9PQ",
    "p1",
  );

  assert.equal(found?.displayName, "User p1");
});

test("enforces room capacity", () => {
  const repo = createRepository();

  createRoom(repo);
  repo.updateStatus("A7K9PQ", "active");

  repo.addParticipant(
    "A7K9PQ",
    makeParticipant("p1"),
  );

  repo.addParticipant(
    "A7K9PQ",
    makeParticipant("p2"),
  );

  repo.addParticipant(
    "A7K9PQ",
    makeParticipant("p3"),
  );

  assert.throws(
    () =>
      repo.addParticipant(
        "A7K9PQ",
        makeParticipant("p4"),
      ),
    /Room is full/,
  );
});

test("updates participant presence", () => {
  const repo = createRepository();

  createRoom(repo);
  repo.updateStatus("A7K9PQ", "active");

  repo.addParticipant(
    "A7K9PQ",
    makeParticipant("p1"),
  );

  repo.updateParticipant("A7K9PQ", "p1", {
    isConnected: false,
  });

  const participant = repo.findParticipant(
    "A7K9PQ",
    "p1",
  );

  assert.equal(participant?.isConnected, false);
});

test("removes participants", () => {
  const repo = createRepository();

  createRoom(repo);
  repo.updateStatus("A7K9PQ", "active");

  repo.addParticipant(
    "A7K9PQ",
    makeParticipant("p1"),
  );

  assert.equal(
    repo.removeParticipant("A7K9PQ", "p1"),
    true,
  );

  assert.equal(
    repo.findParticipant("A7K9PQ", "p1"),
    null,
  );
});

test("stores messages in active rooms", () => {
  const repo = createRepository();

  createRoom(repo);
  repo.updateStatus("A7K9PQ", "active");

  repo.addMessage("A7K9PQ", {
    id: "message-1",
    roomCode: "A7K9PQ",
    type: "chat",
    content: "Hello RoomChat!",
    senderId: "p1",
    senderName: "Alice",
    createdAt: "2026-01-01T10:10:00.000Z",
  });

  const messages = repo.getMessages("A7K9PQ");

  assert.equal(messages.length, 1);
  assert.equal(
    messages[0].content,
    "Hello RoomChat!",
  );
});

test("rejects messages before room activation", () => {
  const repo = createRepository();

  createRoom(repo);

  assert.throws(
    () =>
      repo.addMessage("A7K9PQ", {
        id: "message-1",
        roomCode: "A7K9PQ",
        type: "chat",
        content: "Hello",
        senderId: "p1",
        senderName: "Alice",
        createdAt: new Date().toISOString(),
      }),
    /Messages are not allowed/,
  );
});

test("does not expose creator token hash in snapshots", () => {
  const repo = createRepository();

  createRoom(repo);

  const room = repo.findByCode("A7K9PQ");

  assert.ok(room);

  const snapshot = toRoomSnapshot(room);

  assert.equal(
    Object.hasOwn(snapshot, "creatorTokenHash"),
    false,
  );
});

test("returns defensive copies", () => {
  const repo = createRepository();

  createRoom(repo);

  const room = repo.findByCode("A7K9PQ");

  assert.ok(room);

  room.status = "closed";

  assert.equal(
    repo.findByCode("A7K9PQ")?.status,
    "created",
  );
});

test("deletes rooms", () => {
  const repo = createRepository();

  createRoom(repo);

  assert.equal(repo.delete("A7K9PQ"), true);
  assert.equal(repo.exists("A7K9PQ"), false);
  assert.equal(repo.count(), 0);
});

test("clears all rooms", () => {
  const repo = createRepository();

  createRoom(repo, "A7K9PQ");
  createRoom(repo, "B8L7QR");

  repo.clear();

  assert.equal(repo.count(), 0);
});



test("rejects ordinary members before room start", () => {
  const repo = createRepository();

  createRoom(repo);

  assert.throws(
    () =>
      repo.addParticipant(
        "A7K9PQ",
        makeParticipant("p1"),
      ),
    /Participants cannot join/,
  );
});
