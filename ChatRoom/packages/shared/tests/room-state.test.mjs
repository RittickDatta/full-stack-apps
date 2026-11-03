
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertRoomTransition,
  canJoinRoom,
  canLockRoom,
  canSendMessage,
  canStartRoom,
  canTransitionRoom,
} from "../dist/index.js";

test("allows valid room transitions", () => {
  assert.equal(
    canTransitionRoom("created", "active"),
    true,
  );

  assert.equal(
    canTransitionRoom("active", "locked"),
    true,
  );

  assert.equal(
    canTransitionRoom("locked", "closed"),
    true,
  );
});

test("rejects reopening a locked room", () => {
  assert.equal(
    canTransitionRoom("locked", "active"),
    false,
  );
});

test("closed rooms are terminal", () => {
  assert.equal(
    canTransitionRoom("closed", "active"),
    false,
  );

  assert.equal(
    canTransitionRoom("closed", "created"),
    false,
  );
});

test("only active rooms accept new participants", () => {
  assert.equal(canJoinRoom("created"), false);
  assert.equal(canJoinRoom("active"), true);
  assert.equal(canJoinRoom("locked"), false);
  assert.equal(canJoinRoom("closed"), false);
});

test("locked rooms still allow messaging", () => {
  assert.equal(canSendMessage("active"), true);
  assert.equal(canSendMessage("locked"), true);
  assert.equal(canSendMessage("closed"), false);
});

test("only created rooms can start", () => {
  assert.equal(canStartRoom("created"), true);
  assert.equal(canStartRoom("active"), false);
});

test("only active rooms can be locked", () => {
  assert.equal(canLockRoom("active"), true);
  assert.equal(canLockRoom("locked"), false);
});

test("invalid transitions throw an error", () => {
  assert.throws(
    () => assertRoomTransition("locked", "active"),
    /Invalid room transition/,
  );
});
