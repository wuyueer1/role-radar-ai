import { expect, test } from "@playwright/test";

const sampleJd = `AI 产品经理
负责把人才与职业数据转化为可解释的 AI 产品能力，与业务、设计和工程团队共同定义问题、规划路线图并验证用户价值。
岗位要求：具备数据分析、产品发现和利益相关方管理经验；能够使用机器学习或 NLP embeddings 评估方案；熟悉实验设计和数据可视化。
优先考虑有招聘、人力资源科技或企业级解决方案经验的候选人。需要用清晰证据说明模型边界、业务影响与迭代方向。`;

test("completes the three-minute RoleRadar interview journey", async ({ context, page }, testInfo) => {
  await page.goto("/?location=all");

  await expect(page.getByRole("heading", { name: "RoleRadar AI" })).toBeVisible();
  await expect(page.getByTestId("job-row").first()).toBeVisible();
  expect(await page.getByTestId("job-row").count()).toBeGreaterThanOrEqual(20);
  await expect(page.locator(".freshness-pill")).toContainText(/最新|更新延迟|数据过期/);

  await page.getByRole("button", { name: "查看数据源状态" }).click();
  const sourceDialog = page.getByRole("dialog", { name: "数据源健康状态" });
  await expect(sourceDialog).toBeVisible();
  expect(await sourceDialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await expect(sourceDialog.getByText("Anthropic", { exact: true })).toBeVisible();
  await expect(sourceDialog.getByText("Binance", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭数据源状态" }).click();

  const originalCount = await page.getByTestId("job-row").count();
  await page.getByLabel("数据来源").selectOption("greenhouse");
  await expect.poll(() => page.getByTestId("job-row").count()).toBeLessThan(originalCount);
  await page.getByLabel("数据来源").selectOption("all");

  await page.getByTestId("job-row").first().getByRole("button").click();
  const compact = testInfo.project.name === "mobile";
  const detail = compact
    ? page.getByRole("dialog", { name: /Anthropic|Binance/ })
    : page.locator(".job-detail");
  await expect(detail.getByText("岗位要求 ↔ 候选人证据")).toBeVisible();
  await expect(detail.getByRole("link", { name: /前往原站投递/ })).toHaveAttribute("href", /^https:\/\//);
  if (compact) await detail.getByRole("button", { name: "关闭岗位详情" }).click();

  await page.getByRole("button", { name: /AI 产品岗位簇/ }).click();
  await expect(page.getByRole("status")).toContainText("已筛选 AI 产品岗位簇");
  await expect(page.getByTestId("job-row")).toHaveCount(6);

  await page.getByRole("button", { name: "分析一条 JD" }).click();
  const jdDialog = page.getByRole("dialog", { name: "本地 JD 分析" });
  await expect(jdDialog).toBeVisible();
  expect(await jdDialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await jdDialog.getByRole("textbox", { name: "职位描述" }).fill(sampleJd);
  await jdDialog.getByRole("button", { name: "开始本地分析" }).click();
  await expect(jdDialog.getByText("本地即时分析")).toBeVisible();
  await expect(jdDialog.getByText(/浏览器本地文本相关度/)).toBeVisible();
  await jdDialog.getByRole("button", { name: "关闭 JD 分析" }).click();

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "RoleRadar AI" })).toBeVisible();
  await expect(page.getByTestId("job-row").first()).toBeVisible();
});
