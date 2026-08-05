import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { validSnapshot } from "../fixtures/market-snapshot";

describe("market overview", () => {
  it("shows real counts, freshness, revision, and accessible source health", async () => {
    const user = userEvent.setup();
    render(
      <RoleRadarApp
        initialSnapshot={validSnapshot}
        now={new Date("2026-08-05T04:00:00.000Z")}
      />,
    );

    expect(within(screen.getByTestId("active-metric")).getByText("2")).toBeVisible();
    expect(screen.getAllByText("最新").every((element) => element instanceof HTMLElement)).toBe(true);
    expect(screen.getByText(/aaaaaaaaaa/)).toBeVisible();

    const sourceButton = screen.getByRole("button", { name: "查看数据源状态" });
    await user.click(sourceButton);
    const dialog = screen.getByRole("dialog", { name: "数据源健康状态" });
    expect(dialog).toBeVisible();
    expect(within(dialog).getByText("Anthropic")).toBeVisible();
    expect(within(dialog).getByText("Binance")).toBeVisible();
    await waitFor(() => expect(dialog).toHaveFocus());

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "数据源健康状态" })).not.toBeInTheDocument();
    expect(sourceButton).toHaveFocus();
  });
});
