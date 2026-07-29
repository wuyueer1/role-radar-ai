import { expect, test } from "@playwright/test";

test("completes the interview flow and survives an offline reload", async ({
  context,
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "CareerGraph AI" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveAttribute(
    "data-app-ready",
    "true",
  );
  await expect(page.getByTestId("route-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  const originalOrder = await page
    .getByTestId("route-card")
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("data-route-id")));
  await page.getByRole("button", { name: "最大化技术深度" }).click();
  await expect(page.getByText(/AI 杠杆权重 \+20 个百分点/).first()).toBeVisible();
  const technicalOrder = await page
    .getByTestId("route-card")
    .evaluateAll((cards) => cards.map((card) => card.getAttribute("data-route-id")));
  expect(technicalOrder).not.toEqual(originalOrder);

  await page.getByRole("button", { name: "AI 应用工程师" }).click();
  await expect(
    page.getByRole("heading", { name: "探索角色：AI 应用工程师" }),
  ).toBeVisible();
  await expect(page.getByText(/不属于当前三条策展主路径/)).toBeVisible();

  await page.getByTestId("details-route-ai-product").click();
  const drawer = page.getByRole("dialog", { name: /路径决策依据/ });
  await expect(drawer).toBeVisible();
  expect(
    await drawer.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await page.getByRole("tab", { name: "行动计划" }).click();
  await expect(page.getByText("0–30 天")).toBeVisible();
  await page.getByRole("button", { name: "关闭路径决策依据" }).click();

  await page.getByRole("button", { name: "● 稳定演示" }).click();
  const experience = page.getByRole("textbox", { name: "自由文本经历" });
  await experience.fill("我用图网络研究职业跃迁。");
  await page.getByRole("button", { name: "验证稳定降级" }).click();
  await expect(page.getByText(/已回退到稳定演示模式/)).toBeVisible();
  await expect(experience).toHaveValue("我用图网络研究职业跃迁。");
  await page.getByRole("button", { name: "我明白了" }).click();

  await page.getByRole("button", { name: "开始三分钟讲解" }).click();
  for (let step = 2; step <= 5; step += 1) {
    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByText(`${step} / 5`)).toBeVisible();
  }
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await expect(page.getByText("61–90 天")).toBeVisible();
  await page.getByRole("button", { name: "完成讲解" }).click();

  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "CareerGraph AI" }),
  ).toBeVisible();
  await expect(page.getByTestId("route-card")).toHaveCount(3);
});
