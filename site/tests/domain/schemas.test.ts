import { describe, expect, it } from "vitest";
import profile from "../../data/candidate-profile.json";
import { parseCandidateProfile, parseMarketSnapshot } from "../../src/domain/schemas";
import { validSnapshot } from "../fixtures/market-snapshot";

describe("public data contracts", () => {
  it("accepts a complete market snapshot", () => {
    expect(parseMarketSnapshot(validSnapshot).jobs).toHaveLength(2);
  });

  it("rejects jobs without an original application URL", () => {
    const broken = structuredClone(validSnapshot);
    delete (broken.jobs[0] as { applyUrl?: string }).applyUrl;
    expect(() => parseMarketSnapshot(broken)).toThrow(/applyUrl/);
  });

  it("keeps the public profile anonymous", () => {
    const parsed = parseCandidateProfile(profile);
    expect(parsed.displayName).toBe("Yueer W.");
    expect(JSON.stringify(parsed)).not.toMatch(/@|\+?\d{8,}/);
  });
});
