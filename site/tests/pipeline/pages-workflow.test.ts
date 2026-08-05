import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("RoleRadar Pages workflow", () => {
  it("refreshes reviewed data before publishing and persists only validated JSON", async () => {
    const workflow = await readFile(
      resolve(process.cwd(), "../.github/workflows/role-radar-pages.yml"),
      "utf8",
    );

    expect(workflow).toContain('cron: "17 */4 * * *"');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("cancel-in-progress: true");
    expect(workflow).toContain("actions/checkout@v6");
    expect(workflow).toContain("actions/setup-node@v5");
    expect(workflow).toContain("actions/setup-python@v6");
    expect(workflow).toContain("actions/configure-pages@v5");
    expect(workflow).toContain("actions/upload-pages-artifact@v4");
    expect(workflow).toContain("actions/deploy-pages@v4");
    expect(workflow).toContain("~/.cache/huggingface");
    expect(workflow).toContain("pipeline/embeddings/requirements-e5.txt");
    expect(workflow).toContain("git add current.json history.json source-health.json");

    const orderedSteps = [
      "npm run data:probe",
      "npm run data:update",
      "npm run test:all",
      "npm run build",
      'git commit -m "data: refresh validated market snapshot"',
      "actions/configure-pages@v5",
      "actions/upload-pages-artifact@v4",
      "actions/deploy-pages@v4",
    ].map((value) => workflow.indexOf(value));
    expect(orderedSteps.every((index) => index >= 0)).toBe(true);
    expect(orderedSteps).toEqual([...orderedSteps].sort((left, right) => left - right));
  });
});
