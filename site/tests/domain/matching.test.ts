import { describe, expect, it } from "vitest";
import profile from "../../data/candidate-profile.json";
import { analyzeLocalJd, scoreJob } from "../../src/domain/matching";
import { parseCandidateProfile } from "../../src/domain/schemas";
import { aiProductJob } from "../fixtures/jobs";
import { LOCAL_AI_PM_JD } from "../fixtures/jd-text";

const candidateProfile = parseCandidateProfile(profile);

describe("explainable matching", () => {
  it("uses the approved five-component weights", () => {
    const result = scoreJob(aiProductJob, candidateProfile, {
      semanticPercentile: 80,
      mode: "e5",
    });
    const c = result.componentScores;
    expect(result.matchScore).toBe(
      Math.round(
        c.skill * 0.35 +
          c.evidence * 0.25 +
          c.semantic * 0.2 +
          c.adjacency * 0.1 +
          c.constraints * 0.1,
      ),
    );
  });

  it("links every strength to a real evidence record", () => {
    const result = scoreJob(aiProductJob, candidateProfile, {
      semanticPercentile: 80,
      mode: "e5",
    });
    expect(result.matchedEvidence.length).toBeGreaterThan(0);
    expect(
      result.matchedEvidence.every((item) =>
        profile.evidence.some((evidence) => evidence.id === item.evidenceId),
      ),
    ).toBe(true);
    expect(result.strengths).toHaveLength(result.matchedEvidence.length);
  });

  it("analyzes pasted text locally and rejects navigation noise", () => {
    expect(analyzeLocalJd("首页 登录 下载 APP", candidateProfile)).toMatchObject({
      ok: false,
      reason: "JD_TEXT_TOO_SHORT",
    });
    expect(analyzeLocalJd(LOCAL_AI_PM_JD, candidateProfile)).toMatchObject({
      ok: true,
      analysis: { analysisMode: "local" },
    });
  });
});
