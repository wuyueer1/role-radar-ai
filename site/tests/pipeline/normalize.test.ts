// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeRawJob } from "../../pipeline/normalize";
import { rawGreenhouseJob } from "../fixtures/raw-jobs";

describe("job normalization", () => {
  it("sanitizes HTML and creates a stable fingerprint", () => {
    const first = normalizeRawJob(rawGreenhouseJob);
    const second = normalizeRawJob({
      ...rawGreenhouseJob,
      fetchedAt: "2026-08-06T00:00:00.000Z",
    });

    expect(first.description).not.toContain("<script");
    expect(first.description).not.toContain("alert");
    expect(first.description).toContain("discovery & evaluation");
    expect(first.contentFingerprint).toBe(second.contentFingerprint);
    expect(first.sourceUrls).toEqual([rawGreenhouseJob.sourceUrl]);
  });
});
