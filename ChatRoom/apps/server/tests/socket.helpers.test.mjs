
import assert from "node:assert/strict";
import test from "node:test";

import {
  ackError,
  ackSuccess,
  createSafeAcknowledgement,
} from "../dist/socket/acknowledgements.js";

import {
  executeSocketHandler,
} from "../dist/socket/handler-wrapper.js";

import {
  assignSocketSession,
  clearSocketSession,
  isSocketInRoom,
} from "../dist/socket/socket-session.js";

test("ackSuccess returns a typed success result", () => {
  const result = ackSuccess({
    roomCode: "A7K9PQ",
  });

  assert.deepEqual(result, {
    success: true,
    data: {
      roomCode: "A7K9PQ",
    },
  });
});

test("ackError returns a structured error", () => {
  const result = ackError(
    "ROOM_NOT_FOUND",
    "Room not found.",
  );

  assert.deepEqual(result, {
    success: false,
    error: {
      code: "ROOM_NOT_FOUND",
      message: "Room not found.",
    },
  });
});

test("safe acknowledgement calls the callback once", () => {
  const results = [];

  const acknowledge = createSafeAcknowledgement(
    (result) => {
      results.push(result);
    },
  );

  acknowledge(ackSuccess({ value: 1 }));
  acknowledge(ackSuccess({ value: 2 }));

  assert.equal(results.length, 1);

  assert.deepEqual(results[0], {
    success: true,
    data: { value: 1 },
  });
});

test("handler wrapper acknowledges success", async () => {
  const results = [];

  await executeSocketHandler(
    "test:success",
    (result) => results.push(result),
    (ack) => {
      ack(ackSuccess({ ok: true }));
    },
  );

  assert.deepEqual(results, [
    {
      success: true,
      data: { ok: true },
    },
  ]);
});

test("handler wrapper converts exceptions to errors", async () => {
  const results = [];

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await executeSocketHandler(
      "test:failure",
      (result) => results.push(result),
      () => {
        throw new Error("Database unavailable");
      },
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(results.length, 1);
  assert.equal(results[0].success, false);
  assert.equal(
    results[0].error.code,
    "INTERNAL_ERROR",
  );
});

test("handler wrapper does not acknowledge twice", async () => {
  const results = [];

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await executeSocketHandler(
      "test:double-ack",
      (result) => results.push(result),
      (ack) => {
        ack(ackSuccess({ ok: true }));

        throw new Error(
          "Notification failed after acknowledgement",
        );
      },
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(results.length, 1);
  assert.equal(results[0].success, true);
});

test("handler wrapper catches async failures", async () => {
  const results = [];

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await executeSocketHandler(
      "test:async-failure",
      (result) => results.push(result),
      async () => {
        await Promise.resolve();
        throw new Error("Async failure");
      },
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(results.length, 1);
  assert.equal(
    results[0].error.code,
    "INTERNAL_ERROR",
  );
});

test("socket session helpers assign and clear identity", () => {
  const socket = {
    data: {},
  };

  assert.equal(isSocketInRoom(socket), false);

  assignSocketSession(socket, {
    roomCode: "A7K9PQ",
    participantId: "participant-123",
    isCreator: true,
  });

  assert.equal(isSocketInRoom(socket), true);
  assert.equal(socket.data.roomCode, "A7K9PQ");
  assert.equal(
    socket.data.participantId,
    "participant-123",
  );
  assert.equal(socket.data.isCreator, true);

  clearSocketSession(socket);

  assert.equal(isSocketInRoom(socket), false);
  assert.deepEqual(socket.data, {});
});
