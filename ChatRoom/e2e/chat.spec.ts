
import {
  test,
  expect,
} from "@playwright/test";

import {
  createRoom,
  startRoom,
  joinRoom,
  sendMessage,
} from "./helpers/room.helpers";

test(
  "two participants exchange real-time messages",
  async ({ browser }) => {
    const aliceContext = await browser.newContext();
    const bobContext = await browser.newContext();

    try {
      const alice = await aliceContext.newPage();
      const bob = await bobContext.newPage();

      const roomCode = await createRoom(
        alice,
        "Alice",
      );

      await startRoom(alice);

      await joinRoom(
        bob,
        roomCode,
        "Bob",
      );

      // Alice sends a message.
      await sendMessage(
        alice,
        "Hello Bob!",
      );

      // Bob receives it.
      await expect(
        bob.getByLabel("Room messages")
          .getByText("Hello Bob!"),
      ).toBeVisible();

      // Bob replies.
      await sendMessage(
        bob,
        "Hello Alice!",
      );

      // Alice receives Bob's reply.
      await expect(
        alice.getByLabel("Room messages")
          .getByText("Hello Alice!"),
      ).toBeVisible();

      // Messages should not be duplicated.
      await expect(
        alice.getByLabel("Room messages")
          .getByText("Hello Bob!"),
      ).toHaveCount(1);

      await expect(
        bob.getByLabel("Room messages")
          .getByText("Hello Alice!"),
      ).toHaveCount(1);
    } finally {
      await aliceContext.close();
      await bobContext.close();
    }
  },
);
