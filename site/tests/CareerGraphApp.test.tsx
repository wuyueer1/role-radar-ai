import { render, screen } from "@testing-library/react";
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
    expect(screen.getAllByText(/最大化技术深度后/).length).toBeGreaterThan(0);
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

  it("opens route evidence and completes the five-step interview tour", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);

    await user.click(screen.getByTestId("details-route-ai-product"));
    expect(
      screen.getByRole("dialog", { name: /路径决策依据/ }),
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "退出讲解" }));
    expect(screen.queryByText("2 / 5")).not.toBeInTheDocument();
  });

  it("explains the stable and Live AI boundary without requiring a key", async () => {
    const user = userEvent.setup();
    render(<CareerGraphApp />);
    await user.click(screen.getByRole("button", { name: "● 稳定演示" }));
    expect(
      screen.getByRole("dialog", { name: "模型边界" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Live AI 未配置")).toBeInTheDocument();
    expect(screen.getByText(/浏览器不保存密钥/)).toBeInTheDocument();
  });
});
