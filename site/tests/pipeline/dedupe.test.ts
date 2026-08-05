// @vitest-environment node
import { describe, expect, it } from "vitest";
import { dedupeJobs } from "../../pipeline/dedupe";
import { normalizeRawJob } from "../../pipeline/normalize";
import { rawGreenhouseJob, rawLeverDuplicate } from "../fixtures/raw-jobs";

describe("conservative job deduplication", () => {
  it("merges cross-source duplicates and keeps the most complete record", () => {
    const result = dedupeJobs([
      normalizeRawJob(rawGreenhouseJob),
      normalizeRawJob(rawLeverDuplicate),
    ]);

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].description).toContain("measurable outcomes");
    expect(result.jobs[0].sourceUrls).toHaveLength(2);
    expect(result.duplicates[0].sourceIds).toHaveLength(2);
  });

  it("never merges jobs from different companies", () => {
    const otherCompany = normalizeRawJob({ ...rawLeverDuplicate, company: "Different AI Co" });
    const result = dedupeJobs([normalizeRawJob(rawGreenhouseJob), otherCompany]);

    expect(result.jobs).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
  });
});
