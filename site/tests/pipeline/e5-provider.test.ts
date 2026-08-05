// @vitest-environment node
import { describe, expect, it } from "vitest";
import { pythonEnvironment, scoreSemanticFit } from "../../pipeline/embeddings/e5-provider";
import { JOBS, PROFILE } from "../fixtures/semantic";

describe("E5 provider", () => {
  it("isolates Python from incompatible user site-packages", () => {
    expect(pythonEnvironment({ PATH: "/usr/bin" })).toEqual({
      PATH: "/usr/bin",
      PYTHONNOUSERSITE: "1",
    });
  });

  it("returns a named deterministic fallback when Python fails", async () => {
    const first = await scoreSemanticFit(PROFILE, JOBS, async () => {
      throw new Error("python unavailable");
    });
    const second = await scoreSemanticFit(PROFILE, JOBS, async () => {
      throw new Error("python unavailable");
    });

    expect(first.mode).toBe("rules-fallback");
    expect(first.modelRevision).toBe("tfidf-v1");
    expect(first.scores).toHaveLength(JOBS.length);
    expect(first.scores).toEqual(second.scores);
  });

  it("converts E5 cosine ties to stable average-rank percentiles", async () => {
    const result = await scoreSemanticFit(PROFILE, JOBS, async () => ({
      modelRevision: "fixture-e5",
      scores: [
        { jobId: JOBS[0].id, cosine: 0.8 },
        { jobId: JOBS[1].id, cosine: 0.8 },
        { jobId: JOBS[2].id, cosine: 0.1 },
      ],
    }));

    expect(result.mode).toBe("e5");
    expect(result.scores.map((score) => score.percentile)).toEqual([75, 75, 0]);
  });
});
