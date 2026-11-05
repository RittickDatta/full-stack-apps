import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as createClient } from "socket.io-client";

import { InMemoryRoomRepository } from "../dist/repositories/in-memory-room.repository.js";

import { RoomService } from "../dist/services/room.service.js";

import { registerRoomHandlers } from "../dist/socket/room.handlers.js";

import { generateCreatorToken } from "../dist/services/creator-token.js";

import { registerChatHandlers } from "../dist/socket/chat.handlers.js";

import { registerPresenceHandlers } from "../dist/socket/presence.handlers.js";

test("room:create returns a successful acknowledgement", async () => {
  const httpServer = createServer();

  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const roomService = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, roomService);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const result = await client.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(result.success, true);

    if (!result.success) return;

    assert.equal(result.data.room.status, "created");
    assert.equal(result.data.room.participantCount, 1);
    assert.equal(repository.count(), 1);

    assert.match(result.data.creatorToken, /^[a-f0-9]{64}$/);
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("creator can start a room through Socket.IO", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const roomService = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, roomService);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const created = await client.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);

    if (!created.success) return;

    const started = await client.timeout(5000).emitWithAck("room:start", {
      roomCode: created.data.room.code,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    if (!started.success) return;

    assert.equal(started.data.room.status, "active");
    assert.equal(
      repository.findByCode(created.data.room.code)?.status,
      "active",
    );

    const serverSocket = io.sockets.sockets.get(client.id);

    assert.ok(serverSocket);

    assert.equal(serverSocket.data.isCreator, true);

    assert.equal(serverSocket.data.roomCode, created.data.room.code);

    assert.equal(serverSocket.rooms.has(created.data.room.code), true);
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("room:start rejects an unauthorized socket", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const roomService = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, roomService);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const created = await client.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);

    if (!created.success) return;

    const started = await client.timeout(5000).emitWithAck("room:start", {
      roomCode: created.data.room.code,
      creatorToken: generateCreatorToken(),
    });

    assert.equal(started.success, false);

    if (started.success) return;

    assert.equal(started.error.code, "NOT_AUTHORIZED");

    assert.equal(
      repository.findByCode(created.data.room.code)?.status,
      "created",
    );

    const serverSocket = io.sockets.sockets.get(client.id);

    assert.ok(serverSocket);

    assert.equal(serverSocket.rooms.has(created.data.room.code), false);
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("a second client joins and notifies the creator", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const roomService = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, roomService);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (socket) =>
          new Promise((resolve, reject) => {
            if (socket.connected) {
              resolve();
              return;
            }

            socket.once("connect", resolve);
            socket.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joinedEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Join event timed out")),
        5000,
      );

      creator.once("participant:joined", (event) => {
        clearTimeout(timeout);
        resolve(event);
      });
    });

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    assert.equal(joined.data.room.participantCount, 2);

    const event = await joinedEvent;

    assert.equal(event.roomCode, roomCode);
    assert.equal(event.participant.displayName, "Bob");
    assert.equal(event.participant.id, joined.data.participantId);

    const memberSocket = io.sockets.sockets.get(member.id);

    assert.ok(memberSocket);
    assert.equal(memberSocket.rooms.has(roomCode), true);
    assert.equal(memberSocket.data.isCreator, false);
    assert.equal(memberSocket.data.participantId, joined.data.participantId);
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("one socket cannot join twice", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (socket) =>
          new Promise((resolve, reject) => {
            if (socket.connected) return resolve();
            socket.once("connect", resolve);
            socket.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const code = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode: code,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const first = await member.timeout(5000).emitWithAck("room:join", {
      roomCode: code,
      displayName: "Bob",
    });

    assert.equal(first.success, true);

    const second = await member.timeout(5000).emitWithAck("room:join", {
      roomCode: code,
      displayName: "Bob Again",
    });

    assert.equal(second.success, false);

    assert.equal(repository.findByCode(code)?.participants.size, 2);
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("room events preserve typed acknowledgements", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const invalid = await client.timeout(5000).emitWithAck("room:create", {
      displayName: " ",
    });

    assert.equal(invalid.success, false);

    if (!invalid.success) {
      assert.equal(invalid.error.code, "INVALID_PAYLOAD");
    }

    const created = await client.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const started = await client.timeout(5000).emitWithAck("room:start", {
      roomCode: created.data.room.code,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);
    if (!started.success) return;

    assert.equal(started.data.room.status, "active");

    const repeated = await client.timeout(5000).emitWithAck("room:start", {
      roomCode: created.data.room.code,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(repeated.success, false);

    if (!repeated.success) {
      assert.equal(repeated.error.code, "NOT_AUTHORIZED");
    }

    assert.equal(repository.count(), 1);
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("two clients exchange real-time chat messages", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (socket) =>
          new Promise((resolve, reject) => {
            if (socket.connected) {
              resolve();
              return;
            }

            socket.once("connect", resolve);
            socket.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    const creatorReceived = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Creator message timed out")),
        5000,
      );

      creator.once("chat:message", (message) => {
        clearTimeout(timeout);
        resolve(message);
      });
    });

    const memberReceived = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Member message timed out")),
        5000,
      );

      member.once("chat:message", (message) => {
        clearTimeout(timeout);
        resolve(message);
      });
    });

    const sent = await member.timeout(5000).emitWithAck("chat:send", {
      roomCode,
      content: "Hello Alice!",
    });

    assert.equal(sent.success, true);
    if (!sent.success) return;

    const [creatorMessage, memberMessage] = await Promise.all([
      creatorReceived,
      memberReceived,
    ]);

    assert.equal(creatorMessage.content, "Hello Alice!");

    assert.equal(creatorMessage.senderName, "Bob");

    assert.equal(creatorMessage.senderId, joined.data.participantId);

    assert.equal(creatorMessage.id, memberMessage.id);

    assert.equal(sent.data.id, creatorMessage.id);

    const history = repository.getMessages(roomCode);

    assert.equal(history.length, 1);
    assert.equal(history[0].id, sent.data.id);
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("unjoined sockets cannot send messages", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const result = await client.timeout(5000).emitWithAck("chat:send", {
      roomCode: "A7K9PQ",
      content: "Unauthorized message",
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(result.error.code, "NOT_AUTHORIZED");
    }

    assert.equal(repository.count(), 0);
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("chat:send cannot write to another room", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const client = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const first = await client.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    const second = await client.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(first.success, true);
    assert.equal(second.success, true);

    if (!first.success || !second.success) return;

    const started = await client.timeout(5000).emitWithAck("room:start", {
      roomCode: first.data.room.code,
      creatorToken: first.data.creatorToken,
    });

    assert.equal(started.success, true);

    const result = await client.timeout(5000).emitWithAck("chat:send", {
      roomCode: second.data.room.code,
      content: "Cross-room message",
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(result.error.code, "NOT_AUTHORIZED");
    }

    assert.equal(repository.getMessages(second.data.room.code).length, 0);
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("disconnecting a member broadcasts offline presence", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerPresenceHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (socket) =>
          new Promise((resolve, reject) => {
            if (socket.connected) {
              resolve();
              return;
            }

            socket.once("connect", resolve);
            socket.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    const participantId = joined.data.participantId;

    // Register the listener before disconnecting.
    const offlineEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Presence update timed out")),
        5000,
      );

      const listener = (event) => {
        const participant = event.room.participants.find(
          (item) => item.id === participantId,
        );

        if (!participant || participant.isConnected) {
          return;
        }

        clearTimeout(timeout);
        creator.off("room:updated", listener);
        resolve(event);
      };

      creator.on("room:updated", listener);
    });

    member.disconnect();

    const event = await offlineEvent;

    const offlineParticipant = event.room.participants.find(
      (item) => item.id === participantId,
    );

    assert.ok(offlineParticipant);
    assert.equal(offlineParticipant.displayName, "Bob");
    assert.equal(offlineParticipant.isConnected, false);

    assert.equal(event.room.participantCount, 2);

    const storedParticipant = repository.findParticipant(
      roomCode,
      participantId,
    );

    assert.equal(storedParticipant?.isConnected, false);
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("creator disconnect does not close the room", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerPresenceHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();

  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (socket) =>
          new Promise((resolve, reject) => {
            if (socket.connected) return resolve();

            socket.once("connect", resolve);
            socket.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    const creatorId = started.data.participantId;

    const presenceEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Creator presence update timed out")),
        5000,
      );

      const listener = (event) => {
        const participant = event.room.participants.find(
          (item) => item.id === creatorId,
        );

        if (!participant || participant.isConnected) {
          return;
        }

        clearTimeout(timeout);
        member.off("room:updated", listener);
        resolve(event);
      };

      member.on("room:updated", listener);
    });

    creator.disconnect();

    const event = await presenceEvent;

    assert.equal(event.room.status, "active");

    const offlineCreator = event.room.participants.find(
      (item) => item.id === creatorId,
    );

    assert.equal(offlineCreator?.isConnected, false);

    assert.equal(repository.findByCode(roomCode)?.status, "active");
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});

test("creator locks room and broadcasts the new status", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    // Listen before requesting the lock.
    const lockedEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Lock broadcast timed out")),
        5000,
      );

      const listener = (event) => {
        if (event.room.status !== "locked") return;

        clearTimeout(timeout);
        member.off("room:updated", listener);
        resolve(event);
      };

      member.on("room:updated", listener);
    });

    const locked = await creator.timeout(5000).emitWithAck("room:lock", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(locked.success, true);
    if (!locked.success) return;

    assert.equal(locked.data.status, "locked");

    const event = await lockedEvent;

    assert.equal(event.room.code, roomCode);
    assert.equal(event.room.status, "locked");
    assert.equal(event.room.participantCount, 2);

    // Locking must not remove existing participants.
    assert.equal(event.room.participants.length, 2);

    // Existing members can continue chatting.
    const message = await member.timeout(5000).emitWithAck("chat:send", {
      roomCode,
      content: "We can still chat!",
    });

    assert.equal(message.success, true);
    assert.equal(repository.findByCode(roomCode)?.status, "locked");
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("regular members cannot lock a room", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);

    // Even with a valid creator token, Bob is not
    // authorized by his socket session.
    const result = await member.timeout(5000).emitWithAck("room:lock", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(result.success, false);
    if (result.success) return;

    assert.equal(result.error.code, "NOT_AUTHORIZED");
    assert.equal(repository.findByCode(roomCode)?.status, "active");
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("new participants cannot join a locked room", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const newcomer = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, newcomer].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const locked = await creator.timeout(5000).emitWithAck("room:lock", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(locked.success, true);

    const joined = await newcomer.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Charlie",
    });

    assert.equal(joined.success, false);
    if (joined.success) return;

    assert.equal(joined.error.code, "ROOM_LOCKED");
    assert.equal(repository.findByCode(roomCode)?.participants.size, 1);
  } finally {
    creator.disconnect();
    newcomer.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("member leave notifies creator and removes membership", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    const participantId = joined.data.participantId;

    const leftEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Leave event timed out")),
        5000,
      );

      creator.once("participant:left", (event) => {
        clearTimeout(timeout);
        resolve(event);
      });
    });

    const updatedEvent = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Room update timed out")),
        5000,
      );

      const listener = (event) => {
        if (event.room.participantCount !== 1) return;

        clearTimeout(timeout);
        creator.off("room:updated", listener);
        resolve(event);
      };

      creator.on("room:updated", listener);
    });

    const left = await member
      .timeout(5000)
      .emitWithAck("room:leave", { roomCode });

    assert.equal(left.success, true);

    const [event, update] = await Promise.all([leftEvent, updatedEvent]);

    assert.equal(event.roomCode, roomCode);
    assert.equal(event.participantId, participantId);
    assert.equal(update.room.participantCount, 1);

    assert.equal(repository.findParticipant(roomCode, participantId), null);

    const sent = await member.timeout(5000).emitWithAck("chat:send", {
      roomCode,
      content: "Can I still send?",
    });

    assert.equal(sent.success, false);
    if (!sent.success) {
      assert.equal(sent.error.code, "NOT_AUTHORIZED");
    }

    const memberServerSocket = io.sockets.sockets.get(member.id);

    assert.ok(memberServerSocket);
    assert.equal(memberServerSocket.rooms.has(roomCode), false);
    assert.equal(memberServerSocket.data.participantId, undefined);
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("creator can leave while members continue chatting", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    const left = await creator
      .timeout(5000)
      .emitWithAck("room:leave", { roomCode });

    assert.equal(left.success, true);

    const room = repository.findByCode(roomCode);

    assert.ok(room);
    assert.equal(room.status, "active");
    assert.equal(room.participants.size, 1);

    const message = await member.timeout(5000).emitWithAck("chat:send", {
      roomCode,
      content: "The conversation continues!",
    });

    assert.equal(message.success, true);
    if (!message.success) return;

    assert.equal(message.data.senderName, "Bob");

    const unauthorized = await creator.timeout(5000).emitWithAck("room:lock", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(unauthorized.success, false);
    if (!unauthorized.success) {
      assert.equal(unauthorized.error.code, "NOT_AUTHORIZED");
    }
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("a socket can join another room after leaving", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const alice = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const bob = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [alice, bob].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const first = await alice.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(first.success, true);
    if (!first.success) return;

    const startedFirst = await alice.timeout(5000).emitWithAck("room:start", {
      roomCode: first.data.room.code,
      creatorToken: first.data.creatorToken,
    });

    assert.equal(startedFirst.success, true);

    const joinedFirst = await bob.timeout(5000).emitWithAck("room:join", {
      roomCode: first.data.room.code,
      displayName: "Bob",
    });

    assert.equal(joinedFirst.success, true);

    const left = await bob.timeout(5000).emitWithAck("room:leave", {
      roomCode: first.data.room.code,
    });

    assert.equal(left.success, true);

    // Alice can create another room even while
    // remaining connected to the first one.
    const second = await alice.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(second.success, true);
    if (!second.success) return;

    // Start the second room from a separate creator socket.
    const charlie = createClient(url, {
      transports: ["websocket"],
      reconnection: false,
    });

    try {
      await new Promise((resolve, reject) => {
        charlie.once("connect", resolve);
        charlie.once("connect_error", reject);
      });

      const startedSecond = await charlie
        .timeout(5000)
        .emitWithAck("room:start", {
          roomCode: second.data.room.code,
          creatorToken: second.data.creatorToken,
        });

      assert.equal(startedSecond.success, true);

      const joinedSecond = await bob.timeout(5000).emitWithAck("room:join", {
        roomCode: second.data.room.code,
        displayName: "Bob",
      });

      assert.equal(joinedSecond.success, true);

      assert.equal(
        repository.findByCode(first.data.room.code)?.participants.size,
        1,
      );

      assert.equal(
        repository.findByCode(second.data.room.code)?.participants.size,
        2,
      );
    } finally {
      charlie.disconnect();
    }
  } finally {
    alice.disconnect();
    bob.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("closing a room notifies members and revokes access", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerChatHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);

    // Register both listeners before closing.
    const creatorClosed = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Creator closure event timed out")),
        5000,
      );

      creator.once("room:closed", (event) => {
        clearTimeout(timer);
        resolve(event);
      });
    });

    const memberClosed = new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Member closure event timed out")),
        5000,
      );

      member.once("room:closed", (event) => {
        clearTimeout(timer);
        resolve(event);
      });
    });

    const closed = await creator.timeout(5000).emitWithAck("room:close", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(closed.success, true);

    const [creatorEvent, memberEvent] = await Promise.all([
      creatorClosed,
      memberClosed,
    ]);

    assert.equal(creatorEvent.roomCode, roomCode);
    assert.equal(memberEvent.roomCode, roomCode);

    const storedRoom = repository.findByCode(roomCode);

    assert.ok(storedRoom);
    assert.equal(storedRoom.status, "closed");

    const creatorSocket = io.sockets.sockets.get(creator.id);
    const memberSocket = io.sockets.sockets.get(member.id);

    assert.ok(creatorSocket);
    assert.ok(memberSocket);

    assert.equal(creatorSocket.rooms.has(roomCode), false);
    assert.equal(memberSocket.rooms.has(roomCode), false);

    assert.equal(creatorSocket.data.participantId, undefined);
    assert.equal(memberSocket.data.participantId, undefined);

    const rejectedMessage = await member
      .timeout(5000)
      .emitWithAck("chat:send", {
        roomCode,
        content: "This must not be saved.",
      });

    assert.equal(rejectedMessage.success, false);
    assert.equal(repository.getMessages(roomCode).length, 0);
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("regular members cannot close rooms", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  const member = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await Promise.all(
      [creator, member].map(
        (client) =>
          new Promise((resolve, reject) => {
            if (client.connected) return resolve();
            client.once("connect", resolve);
            client.once("connect_error", reject);
          }),
      ),
    );

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    const joined = await member.timeout(5000).emitWithAck("room:join", {
      roomCode,
      displayName: "Bob",
    });

    assert.equal(joined.success, true);

    // Bob has the correct token but is not the creator.
    const result = await member.timeout(5000).emitWithAck("room:close", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(result.error.code, "NOT_AUTHORIZED");
    }

    assert.equal(repository.findByCode(roomCode)?.status, "active");
  } finally {
    creator.disconnect();
    member.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("creator can close a room before starting it", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const creator = createClient(`http://127.0.0.1:${address.port}`, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      if (creator.connected) return resolve();
      creator.once("connect", resolve);
      creator.once("connect_error", reject);
    });

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const closed = await creator.timeout(5000).emitWithAck("room:close", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(closed.success, true);

    assert.equal(repository.findByCode(roomCode)?.status, "closed");

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, false);

    if (!started.success) {
      assert.equal(started.error.code, "ROOM_CLOSED");
    }
  } finally {
    creator.disconnect();

    await new Promise((resolve) => io.close(resolve));
  }
});

test("disconnecting the last participant starts room expiration", async () => {
  const httpServer = createServer();
  const io = new Server(httpServer);

  const repository = new InMemoryRoomRepository();
  const service = new RoomService(repository);

  io.on("connection", (socket) => {
    registerRoomHandlers(socket, service);
    registerPresenceHandlers(socket, service);
  });

  await new Promise((resolve) => {
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert.ok(address);
  assert.notEqual(typeof address, "string");

  const url = `http://127.0.0.1:${address.port}`;

  const creator = createClient(url, {
    transports: ["websocket"],
    reconnection: false,
  });

  try {
    await new Promise((resolve, reject) => {
      if (creator.connected) return resolve();
      creator.once("connect", resolve);
      creator.once("connect_error", reject);
    });

    const created = await creator.timeout(5000).emitWithAck("room:create", {
      displayName: "Alice",
    });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator.timeout(5000).emitWithAck("room:start", {
      roomCode,
      creatorToken: created.data.creatorToken,
    });

    assert.equal(started.success, true);

    creator.disconnect();

    // Wait for the server's disconnect handler to finish.
    const deadline = Date.now() + 5000;

    while (Date.now() < deadline) {
      const room = repository.findByCode(roomCode);

      if (
        room?.participants.size === 1 &&
        [...room.participants.values()].every(
          (participant) => !participant.isConnected,
        ) &&
        room.emptySince !== null
      ) {
        assert.equal(room.status, "active");
        assert.ok(room.emptySince);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    assert.fail("Room was not marked empty after disconnect");
  } finally {
    creator.disconnect();
    await new Promise((resolve) => io.close(resolve));
  }
});
