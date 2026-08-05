import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const siteRoot = process.cwd();
const repositoryRoot = resolve(siteRoot, "..");
const trackedSiteFiles = execFileSync("git", ["ls-files", "site"], {
  cwd: repositoryRoot,
  encoding: "utf8",
})
  .trim()
  .split("\n")
  .filter(Boolean);

describe("public repository hygiene", () => {
  it("uses RoleRadar release metadata and only official npm registry URLs", () => {
    const packageJson = JSON.parse(readFileSync(join(siteRoot, "package.json"), "utf8"));
    expect(packageJson).toMatchObject({
      name: "role-radar-ai",
      version: "1.0.0",
      description: "Public explainable AI job intelligence portfolio",
    });

    const lock = JSON.parse(readFileSync(join(siteRoot, "package-lock.json"), "utf8"));
    const resolvedUrls = Object.values(lock.packages as Record<string, { resolved?: string }>)
      .map((entry) => entry.resolved)
      .filter((value): value is string => Boolean(value));
    expect(resolvedUrls.length).toBeGreaterThan(0);
    expect(resolvedUrls.every((url) => url.startsWith("https://registry.npmjs.org/"))).toBe(true);
  });

  it("contains no obsolete private hosting runtime or CareerGraph source", () => {
    expect(existsSync(join(siteRoot, ".openai/hosting.json"))).toBe(false);
    const obsoletePaths = [
      "app",
      "worker",
      "build",
      "next.config.ts",
      "tests/CareerGraphApp.test.tsx",
      "tests/career-engine.test.mjs",
      "tests/rendered-html.test.mjs",
    ];
    obsoletePaths.forEach((path) => expect(existsSync(join(siteRoot, path))).toBe(false));

    const sourceFiles = trackedSiteFiles.filter((path) =>
      existsSync(join(repositoryRoot, path)) &&
      !path.endsWith("repository-hygiene.test.ts") &&
      (/^site\/(?:src|pipeline|app|worker|build|tests)\//.test(path) ||
        /^site\/(?:next\.config|eslint\.config)/.test(path)),
    );
    const legacy = new RegExp(
      ["Career", "Graph|curated demo|OpenAI login|vi", "next|wrang", "ler"].join(""),
      "i",
    );
    for (const path of sourceFiles) {
      expect(readFileSync(join(repositoryRoot, path), "utf8"), path).not.toMatch(legacy);
    }
  });

  it("publishes no candidate contact details or API credentials", () => {
    const textExtensions = new Set([".html", ".json", ".svg", ".txt", ".xml"]);
    const publicFiles = trackedSiteFiles.filter(
      (path) => path.startsWith("site/public/") && textExtensions.has(extname(path)),
    );
    const email = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/;
    const mainlandMobile = /(?:^|\D)1[3-9]\d{9}(?:\D|$)/;
    const internationalPhone = /\+\d{1,3}[\s().-]+(?:\d[\s().-]*){7,12}\d/;
    const credential = /(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|api[_-]?key\s*[:=])/i;
    for (const path of publicFiles) {
      const content = readFileSync(join(repositoryRoot, path), "utf8");
      expect(content, `${path} email`).not.toMatch(email);
      expect(content, `${path} mainland phone`).not.toMatch(mainlandMobile);
      expect(content, `${path} international phone`).not.toMatch(internationalPhone);
      expect(content, `${path} credential`).not.toMatch(credential);
    }
  });
});
