import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";

describe("RoleRadarApp shell", () => {
  it("introduces the public job-intelligence product", () => {
    render(<RoleRadarApp />);
    expect(screen.getByRole("heading", { name: "RoleRadar AI" })).toBeVisible();
    expect(screen.getByText("把招聘市场变成可解释的个人机会")).toBeVisible();
    expect(screen.getByRole("button", { name: "分析一条 JD" })).toBeEnabled();
  });
});
