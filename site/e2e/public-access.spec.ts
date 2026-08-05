import { expect, test } from "@playwright/test";

test("opens as a public portfolio without an account gate", async ({ page }) => {
  await page.goto("/?location=all");

  await expect(page).toHaveTitle(/RoleRadar AI/);
  await expect(page.getByRole("heading", { name: "RoleRadar AI" })).toBeVisible();
  await expect(page.getByText(/登录 OpenAI|Sign in with OpenAI|Continue with ChatGPT/i)).toHaveCount(0);
  await expect(page.getByText("65").first()).toBeVisible();
  await expect(page.getByText("真实岗位 · 可追溯证据")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
