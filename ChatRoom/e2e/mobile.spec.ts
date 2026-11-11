
// import {
//   test,
//   expect,
// } from "@playwright/test";

// test(
//   "home page remains usable on a mobile viewport",
//   async ({ page }) => {
//     await page.goto("/");

//     await expect(
//       page.getByRole("link", {
//         name: /create room/i,
//       }).first(),
//     ).toBeVisible();

//     const hasHorizontalOverflow =
//       await page.evaluate(() => {
//         return (
//           document.documentElement.scrollWidth >
//           window.innerWidth
//         );
//       });

//     expect(hasHorizontalOverflow).toBe(false);
//   },
// );
