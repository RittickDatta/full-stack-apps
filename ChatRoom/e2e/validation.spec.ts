
import {
  test,
  expect,
} from "@playwright/test";

test(
  "create room rejects an empty display name",
  async ({ page }) => {
    await page.goto("/create");

    await page
      .getByRole("button", {
        name: /create room/i,
      })
      .click();

    await expect(
      page.getByLabel("Display name"),
    ).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await expect(page).toHaveURL(/\/create$/);
  },
);

// test(
//   "join room rejects an invalid room code",
//   async ({ page }) => {
//     await page.goto("/join");

//     await page
//       .getByLabel("Room code")
//       .fill("ABC");

//     await page
//       .getByLabel("Display name")
//       .fill("Bob");

//     await page
//       .getByRole("button", {
//         name: /join room/i,
//       })
//       .click();

//     await expect(
//       page.getByText(
//         /6 characters|invalid room code/i,
//       ).first(),
//     ).toBeVisible();

//     await expect(page).toHaveURL(/\/join$/);
//   },
// );
