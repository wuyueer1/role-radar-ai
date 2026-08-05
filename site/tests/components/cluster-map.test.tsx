import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { validSnapshot } from "../fixtures/market-snapshot";

it("filters real jobs from a keyboard-accessible cluster node", async () => {
  window.history.replaceState({}, "", "/?location=all");
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);

  const graphic = screen.getByRole("img", { name: /AI 岗位簇技能关系图/ });
  expect(graphic).toHaveAttribute("preserveAspectRatio", "none");
  expect(graphic.querySelectorAll("ellipse")).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: /AI 产品岗位簇/ }));
  expect(screen.getByRole("status")).toHaveTextContent("已筛选 AI 产品岗位簇");
  expect(screen.getAllByTestId("job-row")).toHaveLength(1);
  expect(screen.getByText("基于已接入真实岗位，不代表全市场")).toBeVisible();
});
