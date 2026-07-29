import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { CareerGraphApp } from "../app/CareerGraphApp";

describe("CareerGraphApp", () => {
  it("renders three ranked routes with five component scores each", () => {
    render(<CareerGraphApp />);
    expect(screen.getAllByTestId("route-card")).toHaveLength(3);
    expect(screen.getAllByTestId("component-score")).toHaveLength(15);
    expect(screen.getByText("总权重 100%")).toBeInTheDocument();
  });

  it("re-ranks the routes when the technical scenario is selected", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);
    const before = screen
      .getAllByTestId("route-card")
      .map((card) => card.getAttribute("data-route-id"));

    await user.click(
      screen.getByRole("button", { name: "最大化技术深度" }),
    );

    const after = screen
      .getAllByTestId("route-card")
      .map((card) => card.getAttribute("data-route-id"));
    expect(after).not.toEqual(before);
    expect(screen.getAllByText(/最大化技术深度：/).length).toBeGreaterThan(0);
  });

  it("focuses a graph node and clears focus with Escape", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);

    await user.click(
      screen.getByRole("button", {
        name: "People Analytics 数据科学家",
      }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("已聚焦");
    expect(screen.getByText(/再次点击或按 Esc/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText(/再次点击或按 Esc/)).not.toBeInTheDocument();
  });

  it("keeps an off-route role visible and explains its skill evidence", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);
    const role = screen.getByRole("button", { name: "AI 应用工程师" });

    await user.click(role);

    expect(role).toHaveAttribute("aria-pressed", "true");
    expect(role).not.toHaveClass("is-muted");
    expect(
      screen.getByRole("heading", { name: "探索角色：AI 应用工程师" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/不属于当前三条策展主路径/)).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "关键技能" })).getByText(
        "前端工程",
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelector(
        '[data-transition="bridge-ai-product-analyst-target-ai-application-engineer"]',
      ),
    ).toHaveClass("is-active");
    expect(
      within(screen.getByRole("list", { name: "已有证据" })).getByText(
        "岗位文本归一化",
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "待补技能" })).getByText(
        "API 集成",
      ),
    ).toBeInTheDocument();
  });

  it("opens route evidence and completes the five-step interview tour", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);

    await user.click(screen.getByTestId("details-route-ai-product"));
    const drawer = screen.getByRole("dialog", { name: /路径决策依据/ });
    expect(drawer).toBeInTheDocument();
    await waitFor(() =>
      expect(drawer).toContainElement(
        document.activeElement as HTMLElement | null,
      ),
    );
    expect(screen.getByTestId("app-content")).toHaveAttribute("inert");
    await user.click(screen.getByRole("tab", { name: "行动计划" }));
    expect(screen.getByText("0–30 天")).toBeInTheDocument();
    expect(screen.getByText("61–90 天")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "模型说明" }));
    expect(screen.getByText(/AI 不能修改底层分数/)).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.click(
      screen.getByRole("button", { name: "开始三分钟讲解" }),
    );
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
    for (let step = 2; step <= 5; step += 1) {
      await user.click(screen.getByRole("button", { name: "下一步" }));
      expect(screen.getByText(`${step} / 5`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(screen.getByText("0–30 天")).toBeInTheDocument();
    expect(screen.getByText("61–90 天")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "完成讲解" }));
    expect(screen.queryByText("5 / 5")).not.toBeInTheDocument();
  });

  it("demonstrates the stable Live AI fallback without losing user text", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);
    await user.click(screen.getByRole("button", { name: "● 稳定演示" }));
    expect(
      screen.getByRole("dialog", { name: "模型边界" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Live AI 未配置")).toBeInTheDocument();
    expect(screen.getByText(/浏览器不保存密钥/)).toBeInTheDocument();
    const text = screen.getByRole("textbox", { name: "自由文本经历" });
    await user.type(text, "我用图网络研究职业跃迁。");
    await user.click(screen.getByRole("button", { name: "验证稳定降级" }));
    expect(text).toHaveValue("我用图网络研究职业跃迁。");
    expect(screen.getByText(/已回退到稳定演示模式/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "启用 Live AI（需服务端端点）" }),
    ).toBeDisabled();
  });
});
