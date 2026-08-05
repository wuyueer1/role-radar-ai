import type { JobSourceAdapter, SourceRegistryEntry } from "../../pipeline/adapters/types";
import type { SemanticFitResult } from "../../pipeline/embeddings/e5-provider";
import { parseMarketSnapshot } from "../../src/domain/schemas";
import type { CandidateProfile, NormalizedJob } from "../../src/domain/types";
import { rawGreenhouseJob } from "./raw-jobs";
import { validSnapshot } from "./market-snapshot";

const successfulEntry: SourceRegistryEntry = {
  id: "fixture-greenhouse",
  provider: "greenhouse",
  company: "Fixture AI",
  boardToken: "fixture-ai",
  enabled: true,
  termsUrl: "https://developer.greenhouse.io/job-board.html",
  reviewedAt: "2026-08-05",
};

const failingEntry: SourceRegistryEntry = {
  id: "fixture-lever",
  provider: "lever",
  company: "Broken Fixture",
  siteName: "broken-fixture",
  enabled: true,
  termsUrl: "https://github.com/lever/postings-api",
  reviewedAt: "2026-08-05",
};

const successfulSource: JobSourceAdapter = {
  fetch: async () => [
    {
      ...rawGreenhouseJob,
      sourceRegistryId: successfulEntry.id,
      company: successfulEntry.company,
      fetchedAt: "2026-08-05T04:00:00.000Z",
    },
  ],
};

const failingSource: JobSourceAdapter = {
  fetch: async () => {
    throw new Error("fixture source unavailable");
  },
};

export const successfulAdapter = { entry: successfulEntry, adapter: successfulSource };
export const failingAdapter = { entry: failingEntry, adapter: failingSource };

export const PREVIOUS_SNAPSHOT = parseMarketSnapshot(validSnapshot);

export const FIXED_SEMANTIC_PROVIDER = async (
  _profile: CandidateProfile,
  jobs: NormalizedJob[],
): Promise<SemanticFitResult> => ({
  mode: "e5",
  modelRevision: "fixture-e5-v1",
  scores: jobs.map((job, index) => ({
    jobId: job.id,
    cosine: Number((0.8 - index * 0.01).toFixed(4)),
    percentile: Math.max(0, 90 - index),
  })),
});
