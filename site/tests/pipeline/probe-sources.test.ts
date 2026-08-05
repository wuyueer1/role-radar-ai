// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import greenhouseFixture from "../../pipeline/fixtures/greenhouse.json";
import leverFixture from "../../pipeline/fixtures/lever.json";
import { probeSources } from "../../pipeline/probe-sources";
import type { SourceRegistryEntry } from "../../pipeline/adapters/types";

const entries: SourceRegistryEntry[] = [
  {
    id: "anthropic-greenhouse",
    provider: "greenhouse",
    company: "Anthropic",
    boardToken: "anthropic",
    enabled: true,
    termsUrl: "https://developer.greenhouse.io/job-board.html",
    reviewedAt: "2026-08-05",
  },
  {
    id: "binance-lever",
    provider: "lever",
    company: "Binance",
    siteName: "binance",
    enabled: true,
    termsUrl: "https://github.com/lever/postings-api",
    reviewedAt: "2026-08-05",
  },
];

describe("source probe", () => {
  it("validates enabled entries through their real adapters without network", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const body = url.includes("greenhouse") ? greenhouseFixture : leverFixture;
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    const stdout = vi.fn();
    const stderr = vi.fn();

    const result = await probeSources(entries, { fetcher, stdout, stderr, timeoutMs: 100 });

    expect(result.ok).toBe(true);
    expect(result.results.map((item) => item.count)).toEqual([1, 1]);
    expect(stdout).toHaveBeenCalledWith("PASS anthropic-greenhouse 1");
    expect(stdout).toHaveBeenCalledWith("PASS binance-lever 1");
    expect(stderr).not.toHaveBeenCalled();
  });

  it("reports an invalid source contract without hiding the reason", async () => {
    const fetcher = vi.fn(async () => new Response("{}", { status: 200 })) as typeof fetch;
    const stderr = vi.fn();

    const result = await probeSources([entries[0]], { fetcher, stderr, stdout: vi.fn() });

    expect(result.ok).toBe(false);
    expect(result.results[0]).toMatchObject({ id: "anthropic-greenhouse", status: "failed" });
    expect(stderr).toHaveBeenCalledWith(expect.stringMatching(/^FAIL anthropic-greenhouse /));
  });
});
