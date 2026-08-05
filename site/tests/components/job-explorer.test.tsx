import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { validSnapshot } from "../fixtures/market-snapshot";

beforeEach(() => {
  window.history.replaceState({}, "", "/?location=all");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("filters jobs and exposes traceable evidence before applying", async () => {
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);

  await user.type(screen.getByRole("searchbox", { name: "搜索职位或公司" }), "Anthropic");
  expect(screen.getAllByTestId("job-row")).toHaveLength(1);
  const row = screen.getByTestId("job-row");
  await user.click(within(row).getByRole("button"));

  expect(screen.getByRole("heading", { name: /Anthropic/ })).toBeVisible();
  expect(screen.getByText("核心技能覆盖")).toBeVisible();
  expect(screen.getByText(/48 万余名劳动者/)).toBeVisible();
  expect(screen.getByText("语义相关度")).toBeVisible();
  expect(screen.getByText(/fixture-e5-v1/)).toBeVisible();
  expect(screen.getByRole("link", { name: "前往原站投递" })).toHaveAttribute(
    "rel",
    "noopener noreferrer",
  );
  expect(window.location.search).toContain(`job=${encodeURIComponent(validSnapshot.jobs[0].id)}`);
});

it("combines family and source controls and announces the result count", async () => {
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);

  await user.selectOptions(screen.getByLabelText("角色方向"), "ai-solutions");
  await user.selectOptions(screen.getByLabelText("数据来源"), "lever");
  expect(screen.getByRole("status")).toHaveTextContent("找到 1 个岗位");
  expect(screen.getAllByTestId("job-row")).toHaveLength(1);
  expect(screen.getByText("Binance")).toBeVisible();
});

it("opens the selected job as a focus-managed dialog below 1024px", async () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);

  const firstRowButton = within(screen.getAllByTestId("job-row")[0]).getByRole("button");
  await user.click(firstRowButton);
  expect(screen.getByRole("dialog", { name: /Anthropic/ })).toBeVisible();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: /Anthropic/ })).not.toBeInTheDocument();
  expect(firstRowButton).toHaveFocus();
});
