import { describe, expect, it } from "vitest";
import { computeTrends } from "../../src/domain/trends";
import { historyFixture } from "../fixtures/market-history";

describe("complete-period market trends", () => {
  it("suppresses skill momentum below five jobs", () => {
    const trend = computeTrends(historyFixture, "2026-08-05");
    expect(trend.skillStats.some((skill) => skill.jobCount < 5)).toBe(false);
    expect(trend.skillStats[0].sampleSize).toBeGreaterThanOrEqual(5);
    expect(trend.scope).toBe("connected-sources-only");
  });
});
