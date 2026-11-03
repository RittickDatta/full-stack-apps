
import assert from "node:assert/strict";
import test from "node:test";

import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as createClient } from "socket.io-client";

import {
  InMemoryRoomRepository,
} from "../dist/repositories/in-memory-room.repository.js";

import {
  RoomService,
} from "../dist/services/room.service.js";

import {
  registerRoomHandlers,
} from "../dist/socket/room.handlers.js";

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
      .emitWithAck("room:create", {
        displayName: "Alice",
      });

    assert.equal(result.success, true);

    if (!result.success) return;

    assert.equal(result.data.room.status, "created");
    assert.equal(result.data.room.participantCount, 1);
    assert.equal(repository.count(), 1);

    assert.match(
      result.data.creatorToken,
      /^[a-f0-9]{64}$/,
    );
  } finally {
    client.disconnect();

    await new Promise((resolve) => {
      io.close(resolve);
    });
  }
});
