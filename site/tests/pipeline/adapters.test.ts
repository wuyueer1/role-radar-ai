// @vitest-environment node
import { describe, expect, it } from "vitest";
import greenhouseFixture from "../../pipeline/fixtures/greenhouse.json";
import leverFixture from "../../pipeline/fixtures/lever.json";
import { mapGreenhouseJobs } from "../../pipeline/adapters/greenhouse";
import { mapLeverJobs } from "../../pipeline/adapters/lever";

describe("job source adapters", () => {
  it("maps published Greenhouse jobs", () => {
    const jobs = mapGreenhouseJobs(
      greenhouseFixture,
      "Anthropic",
      "anthropic-greenhouse",
      "2026-08-05T00:00:00.000Z",
    );
    expect(jobs[0]).toMatchObject({ source: "greenhouse", company: "Anthropic" });
    expect(jobs[0].applyUrl).toMatch(/^https:/);
  });

  it("maps published Lever jobs", () => {
    const jobs = mapLeverJobs(
      leverFixture,
      "Binance",
      "binance-lever",
      "2026-08-05T00:00:00.000Z",
    );
    expect(jobs[0]).toMatchObject({ source: "lever", company: "Binance" });
    expect(jobs[0].locations.length).toBeGreaterThan(0);
  });
});
