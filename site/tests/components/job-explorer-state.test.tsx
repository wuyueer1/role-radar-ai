import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { parseMarketSnapshot } from "../../src/domain/schemas";
import { useJobExplorer } from "../../src/state/useJobExplorer";
import { validSnapshot } from "../fixtures/market-snapshot";

const jobs = parseMarketSnapshot(validSnapshot).jobs;

function ExplorerStateProbe() {
  const explorer = useJobExplorer(jobs);
  return (
    <div>
      <output data-testid="query">{explorer.query}</output>
      <output data-testid="family">{explorer.family}</output>
      <output data-testid="source">{explorer.source}</output>
      <output data-testid="sort">{explorer.sort}</output>
      <output data-testid="selected">{explorer.selectedJob?.id ?? "none"}</output>
      <output data-testid="visible">{explorer.visibleJobs.length}</output>
      <button type="button" onClick={() => explorer.setQuery("Binance")}>
        只看 Binance
      </button>
    </div>
  );
}

describe("query-backed explorer state", () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      `/?q=Anthropic&family=ai-product&sort=updated&source=invalid&job=${jobs[1].id}`,
    );
  });

  it("ignores invalid values, combines filters, and repairs hidden selection", async () => {
    const user = userEvent.setup();
    render(<ExplorerStateProbe />);

    expect(screen.getByTestId("query")).toHaveTextContent("Anthropic");
    expect(screen.getByTestId("family")).toHaveTextContent("ai-product");
    expect(screen.getByTestId("source")).toHaveTextContent("all");
    expect(screen.getByTestId("sort")).toHaveTextContent("updated");
    expect(screen.getByTestId("visible")).toHaveTextContent("1");
    await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent(jobs[0].id));

    await user.click(screen.getByRole("button", { name: "只看 Binance" }));
    await waitFor(() => expect(screen.getByTestId("visible")).toHaveTextContent("0"));
    expect(screen.getByTestId("selected")).toHaveTextContent("none");
    expect(window.location.search).toContain("q=Binance");
    expect(window.location.search).not.toContain("source=invalid");
    expect(window.location.search).not.toContain("job=");
  });

  it("shows a safe load error and succeeds on retry", async () => {
    window.history.replaceState({}, "", "/");
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("secret /srv/data path", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(validSnapshot), { status: 200 }));
    const user = userEvent.setup();

    render(<RoleRadarApp fetcher={fetcher} />);
    expect(screen.getByText("正在读取最近成功的岗位快照…")).toBeVisible();
    expect(await screen.findByRole("alert")).toHaveTextContent("暂时无法读取岗位快照");
    expect(screen.queryByText(/srv|503/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "重试读取" }));
    expect(await screen.findByText("已载入 2 个真实岗位")).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
