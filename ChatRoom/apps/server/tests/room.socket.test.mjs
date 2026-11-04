import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as createClient } from "socket.io-client";

import { InMemoryRoomRepository } from "../dist/repositories/in-memory-room.repository.js";

import { RoomService } from "../dist/services/room.service.js";

import { registerRoomHandlers } from "../dist/socket/room.handlers.js";

import { generateCreatorToken } from "../dist/services/creator-token.js";

import {
  registerChatHandlers,
} from "../dist/socket/chat.handlers.js";

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

    const created = await creator
      .timeout(5000)
      .emitWithAck("room:create", {
        displayName: "Alice",
      });

    assert.equal(created.success, true);
    if (!created.success) return;

    const code = created.data.room.code;

    const started = await creator
      .timeout(5000)
      .emitWithAck("room:start", {
        roomCode: code,
        creatorToken: created.data.creatorToken,
      });

    assert.equal(started.success, true);

    const first = await member
      .timeout(5000)
      .emitWithAck("room:join", {
        roomCode: code,
        displayName: "Bob",
      });

    assert.equal(first.success, true);

    const second = await member
      .timeout(5000)
      .emitWithAck("room:join", {
        roomCode: code,
        displayName: "Bob Again",
      });

    assert.equal(second.success, false);

    assert.equal(
      repository.findByCode(code)?.participants.size,
      2,
    );
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

  const client = createClient(
    `http://127.0.0.1:${address.port}`,
    {
      transports: ["websocket"],
      reconnection: false,
    },
  );

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const invalid = await client
      .timeout(5000)
      .emitWithAck("room:create", {
        displayName: " ",
      });

    assert.equal(invalid.success, false);

    if (!invalid.success) {
      assert.equal(
        invalid.error.code,
        "INVALID_PAYLOAD",
      );
    }

    const created = await client
      .timeout(5000)
      .emitWithAck("room:create", {
        displayName: "Alice",
      });

    assert.equal(created.success, true);
    if (!created.success) return;

    const started = await client
      .timeout(5000)
      .emitWithAck("room:start", {
        roomCode: created.data.room.code,
        creatorToken: created.data.creatorToken,
      });

    assert.equal(started.success, true);
    if (!started.success) return;

    assert.equal(started.data.room.status, "active");

    const repeated = await client
      .timeout(5000)
      .emitWithAck("room:start", {
        roomCode: created.data.room.code,
        creatorToken: created.data.creatorToken,
      });

    assert.equal(repeated.success, false);

    if (!repeated.success) {
      assert.equal(
        repeated.error.code,
        "NOT_AUTHORIZED",
      );
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

    const created = await creator
      .timeout(5000)
      .emitWithAck("room:create", {
        displayName: "Alice",
      });

    assert.equal(created.success, true);
    if (!created.success) return;

    const roomCode = created.data.room.code;

    const started = await creator
      .timeout(5000)
      .emitWithAck("room:start", {
        roomCode,
        creatorToken: created.data.creatorToken,
      });

    assert.equal(started.success, true);

    const joined = await member
      .timeout(5000)
      .emitWithAck("room:join", {
        roomCode,
        displayName: "Bob",
      });

    assert.equal(joined.success, true);
    if (!joined.success) return;

    const creatorReceived = new Promise(
      (resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Creator message timed out")),
          5000,
        );

        creator.once("chat:message", (message) => {
          clearTimeout(timeout);
          resolve(message);
        });
      },
    );

    const memberReceived = new Promise(
      (resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Member message timed out")),
          5000,
        );

        member.once("chat:message", (message) => {
          clearTimeout(timeout);
          resolve(message);
        });
      },
    );

    const sent = await member
      .timeout(5000)
      .emitWithAck("chat:send", {
        roomCode,
        content: "Hello Alice!",
      });

    assert.equal(sent.success, true);
    if (!sent.success) return;

    const [creatorMessage, memberMessage] =
      await Promise.all([
        creatorReceived,
        memberReceived,
      ]);

    assert.equal(
      creatorMessage.content,
      "Hello Alice!",
    );

    assert.equal(
      creatorMessage.senderName,
      "Bob",
    );

    assert.equal(
      creatorMessage.senderId,
      joined.data.participantId,
    );

    assert.equal(
      creatorMessage.id,
      memberMessage.id,
    );

    assert.equal(
      sent.data.id,
      creatorMessage.id,
    );

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

  const client = createClient(
    `http://127.0.0.1:${address.port}`,
    {
      transports: ["websocket"],
      reconnection: false,
    },
  );

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const result = await client
      .timeout(5000)
      .emitWithAck("chat:send", {
        roomCode: "A7K9PQ",
        content: "Unauthorized message",
      });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(
        result.error.code,
        "NOT_AUTHORIZED",
      );
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

  const client = createClient(
    `http://127.0.0.1:${address.port}`,
    {
      transports: ["websocket"],
      reconnection: false,
    },
  );

  try {
    await new Promise((resolve, reject) => {
      client.once("connect", resolve);
      client.once("connect_error", reject);
    });

    const first = await client
      .timeout(5000)
      .emitWithAck("room:create", {
        displayName: "Alice",
      });

    const second = await client
      .timeout(5000)
      .emitWithAck("room:create", {
        displayName: "Alice",
      });

    assert.equal(first.success, true);
    assert.equal(second.success, true);

    if (!first.success || !second.success) return;

    const started = await client
      .timeout(5000)
      .emitWithAck("room:start", {
        roomCode: first.data.room.code,
        creatorToken: first.data.creatorToken,
      });

    assert.equal(started.success, true);

    const result = await client
      .timeout(5000)
      .emitWithAck("chat:send", {
        roomCode: second.data.room.code,
        content: "Cross-room message",
      });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(
        result.error.code,
        "NOT_AUTHORIZED",
      );
    }

    assert.equal(
      repository.getMessages(second.data.room.code).length,
      0,
    );
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});
