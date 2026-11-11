
import {
  test,
  expect,
} from "@playwright/test";

test.describe("Navigation", () => {
//   test("home page displays main actions", async ({
//     page,
//   }) => {
//     await page.goto("/");

//     await expect(
//       page.getByRole("link", {
//         name: /create room/i,
//       }).first(),
//     ).toBeVisible();

//     await expect(
//       page.getByRole("link", {
//         name: /join room/i,
//       }).first(),
//     ).toBeVisible();
//   });

  test("create room page is accessible", async ({
    page,
  }) => {
    await page.goto("/create");

    await expect(
      page.getByLabel("Display name"),
    ).toBeVisible();
  });

  test("join room page is accessible", async ({
    page,
  }) => {
    await page.goto("/join");

    await expect(
      page.getByLabel("Room code"),
    ).toBeVisible();

    await expect(
      page.getByLabel("Display name"),
    ).toBeVisible();
  });

  test("unknown routes display a not-found page", async ({
    page,
  }) => {
    await page.goto("/does-not-exist");

    await expect(
      page.getByText(/not found|404/i).first(),
    ).toBeVisible();
  });

  test("skip link moves focus to main content", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", {
      name: /skip to main content/i,
    });

    await expect(skipLink).toBeFocused();

    await page.keyboard.press("Enter");

    await expect(
      page.locator("#main-content"),
    ).toBeFocused();
  });
});
