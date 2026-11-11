
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

// test(
//   "creator can lock a room and existing members can still chat",
//   async ({ browser }) => {
//     const aliceContext = await browser.newContext();
//     const bobContext = await browser.newContext();
//     const charlieContext = await browser.newContext();

//     try {
//       const alice = await aliceContext.newPage();
//       const bob = await bobContext.newPage();
//       const charlie = await charlieContext.newPage();

//       const roomCode = await createRoom(alice);
//       await startRoom(alice);

//       await joinRoom(bob, roomCode);

//       await alice
//         .getByRole("button", {
//           name: /^lock room$/i,
//         })
//         .click();

//       await expect(
//         alice.getByRole("dialog"),
//       ).toBeVisible();

//       await alice
//         .getByRole("dialog")
//         .getByRole("button", {
//           name: /lock room/i,
//         })
//         .click();

//       await expect(
//         alice.getByText(
//           /new participants can no longer join/i,
//         ),
//       ).toBeVisible();

//       // Existing participants can still chat.
//       await sendMessage(
//         bob,
//         "Still chatting!",
//       );

//       await expect(
//         alice.getByLabel("Room messages")
//           .getByText("Still chatting!"),
//       ).toBeVisible();

//       // Charlie cannot join.
//       await charlie.goto("/join");

//       await charlie
//         .getByLabel("Room code")
//         .fill(roomCode);

//       await charlie
//         .getByLabel("Display name")
//         .fill("Charlie");

//       await charlie
//         .getByRole("button", {
//           name: /join room/i,
//         })
//         .click();

//       await expect(
//         charlie.getByText(
//           /locked|cannot join/i,
//         ).first(),
//       ).toBeVisible();

//       await expect(charlie).toHaveURL(/\/join$/);
//     } finally {
//       await aliceContext.close();
//       await bobContext.close();
//       await charlieContext.close();
//     }
//   },
// );

// test(
//   "creator can close the room for everyone",
//   async ({ browser }) => {
//     const aliceContext = await browser.newContext();
//     const bobContext = await browser.newContext();

//     try {
//       const alice = await aliceContext.newPage();
//       const bob = await bobContext.newPage();

//       const roomCode = await createRoom(alice);
//       await startRoom(alice);
//       await joinRoom(bob, roomCode);

//       await alice
//         .getByRole("button", {
//           name: /^close room$/i,
//         })
//         .click();

//       await alice
//         .getByRole("dialog")
//         .getByRole("button", {
//           name: /close room/i,
//         })
//         .click();

//       await expect(
//         alice.getByText(
//           /closed the room|room.*closed/i,
//         ).first(),
//       ).toBeVisible();

//       await expect(
//         bob.getByText(
//           /room session unavailable/i,
//         ),
//       ).toBeVisible();
//     } finally {
//       await aliceContext.close();
//       await bobContext.close();
//     }
//   },
// );


// test(
//   "member can leave while creator remains in the room",
//   async ({ browser }) => {
//     const aliceContext = await browser.newContext();
//     const bobContext = await browser.newContext();

//     try {
//       const alice = await aliceContext.newPage();
//       const bob = await bobContext.newPage();

//       const roomCode = await createRoom(alice);
//       await startRoom(alice);
//       await joinRoom(bob, roomCode);

//       await bob
//         .getByRole("button", {
//           name: /^leave room$/i,
//         })
//         .click();

//       await bob
//         .getByRole("dialog")
//         .getByRole("button", {
//           name: /leave room/i,
//         })
//         .click();

//       await expect(bob).toHaveURL("/");

//       await expect(
//         bob.getByText(/you left the room/i),
//       ).toBeVisible();

//       // Alice can still send messages.
//       await sendMessage(
//         alice,
//         "Room is still active",
//       );

//       await expect(
//         alice.getByLabel("Room messages")
//           .getByText("Room is still active"),
//       ).toBeVisible();
//     } finally {
//       await aliceContext.close();
//       await bobContext.close();
//     }
//   },
// );
