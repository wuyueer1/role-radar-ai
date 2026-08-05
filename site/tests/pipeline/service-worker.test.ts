import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("RoleRadar service worker contract", () => {
  it("uses versioned data-aware caching without storing failed or opaque responses", async () => {
    const source = await readFile(join(process.cwd(), "public/sw.js"), "utf8");

    expect(source).toContain('const CACHE_NAME = "role-radar-v1"');
    expect(source).toContain('"./data/current.json"');
    expect(source).toContain("networkFirst");
    expect(source).toContain("cacheFirst");
    expect(source).toContain("isValidJsonResponse");
    expect(source).toContain('response.type !== "opaque"');
    expect(source).toContain("isHashedAsset");
    expect(source).toContain("precacheResourceGraph");
    expect(source).toContain("fallbackRequest");
  });
});
