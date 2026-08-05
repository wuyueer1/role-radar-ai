import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { LOCAL_AI_PM_JD } from "../fixtures/jd-text";
import { validSnapshot } from "../fixtures/market-snapshot";

beforeEach(() => {
  window.history.replaceState({}, "", "/?location=all");
});

it("analyzes JD text locally and keeps it out of persistence", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const user = userEvent.setup();
  const localKeysBefore = Object.keys(localStorage);
  const sessionKeysBefore = Object.keys(sessionStorage);
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);

  await user.click(screen.getByRole("button", { name: "分析一条 JD" }));
  await user.type(screen.getByRole("textbox", { name: "职位描述" }), LOCAL_AI_PM_JD);
  await user.click(screen.getByRole("button", { name: "开始本地分析" }));
  expect(screen.getByText("本地即时分析")).toBeVisible();
  expect(screen.getByText(/浏览器本地文本相关度/)).toBeVisible();
  expect(Object.keys(localStorage)).toEqual(localKeysBefore);
  expect(Object.keys(sessionStorage)).toEqual(sessionKeysBefore);
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

it("blocks automatic reads from BOSS and liepin without issuing a request", async () => {
  const request = vi.spyOn(globalThis, "fetch");
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);

  await user.click(screen.getByRole("button", { name: "分析一条 JD" }));
  await user.type(
    screen.getByRole("textbox", { name: "职位描述" }),
    "https://www.zhipin.com/job_detail/example.html",
  );
  await user.click(screen.getByRole("button", { name: "开始本地分析" }));
  expect(screen.getByRole("alert")).toHaveTextContent("平台限制自动读取，请复制职位描述");
  expect(request).not.toHaveBeenCalled();
  request.mockRestore();
});
