
import {
  expect,
  type Page,
} from "@playwright/test";

export async function createRoom(
  page: Page,
  displayName = "Alice",
): Promise<string> {
  await page.goto("/create");

  await page
    .getByLabel("Display name")
    .fill(displayName);

  await page
    .getByRole("button", {
      name: /create room/i,
    })
    .click();

  await expect(page).toHaveURL(
    /\/room\/[A-Z0-9]{6}$/,
  );

  const url = new URL(page.url());
  const roomCode = url.pathname.split("/").at(-1);

  if (!roomCode) {
    throw new Error(
      "Room code missing after room creation",
    );
  }

  return roomCode;
}

export async function startRoom(
  page: Page,
): Promise<void> {
  await page
    .getByRole("button", {
      name: /start room/i,
    })
    .click();

  await expect(
    page.getByLabel("Room messages"),
  ).toBeVisible();
}

export async function joinRoom(
  page: Page,
  roomCode: string,
  displayName = "Bob",
): Promise<void> {
  await page.goto("/join");

  await page
    .getByLabel("Room code")
    .fill(roomCode);

  await page
    .getByLabel("Display name")
    .fill(displayName);

  await page
    .getByRole("button", {
      name: /join room/i,
    })
    .click();

  await expect(page).toHaveURL(
    new RegExp(`/room/${roomCode}$`, "i"),
  );

  await expect(
    page.getByLabel("Room messages"),
  ).toBeVisible();
}

export async function sendMessage(
  page: Page,
  content: string,
): Promise<void> {
  const input = page.getByLabel("Your message");

  await input.fill(content);

  await page
    .getByRole("button", {
      name: /^send$/i,
    })
    .click();

  await expect(input).toHaveValue("");
}
