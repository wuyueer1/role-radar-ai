import { parseMarketSnapshot } from "../../src/domain/schemas";
import type { NormalizedJob, RoleFamily } from "../../src/domain/types";
import type { DailyMarketRecord } from "../../src/domain/trends";
import { validSnapshot } from "./market-snapshot";

const baseJob = parseMarketSnapshot(validSnapshot).jobs[0];

const makeJob = (
  id: string,
  roleFamily: RoleFamily,
  company: string,
  skills: string[],
): NormalizedJob => ({
  ...baseJob,
  id,
  sourceJobId: id,
  company,
  title: `${roleFamily} fixture`,
  normalizedTitle: `${roleFamily} fixture`,
  roleFamily,
  skills,
  intelligence: undefined,
} as unknown as NormalizedJob);

export const scoredJobsFixture: NormalizedJob[] = [
  makeJob("job-1", "ai-product", "Alpha AI", ["llm", "product-discovery", "user-research"]),
  makeJob("job-2", "ai-product", "Beta AI", ["llm", "product-discovery", "data-analysis"]),
  makeJob("job-3", "ai-solutions", "Gamma AI", ["llm", "solution-design", "stakeholder-management"]),
  makeJob("job-4", "ai-engineering", "Delta AI", ["llm", "rag", "python"]),
  makeJob("job-5", "data-science", "Epsilon AI", ["machine-learning", "python", "data-analysis"]),
  makeJob("job-6", "people-analytics", "Zeta AI", ["data-analysis", "causal-inference", "stakeholder-management"]),
];

const dateAtOffset = (offset: number): string => {
  const date = new Date("2026-08-04T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
};

export const historyFixture: DailyMarketRecord[] = Array.from({ length: 60 }, (_, offset) => {
  const currentWindow = offset < 7;
  const jobIds = currentWindow
    ? ["job-1", "job-2", "job-3", "job-4", "job-5", "job-6"]
    : ["job-1", "job-2", "job-3", "job-old"];
  return {
    date: dateAtOffset(offset),
    jobIds,
    skillJobIds: {
      llm: currentWindow ? ["job-1", "job-2", "job-3", "job-4", "job-5"] : ["job-1", "job-2", "job-3"],
      "rare-skill": ["job-1", "job-2"],
      "data-analysis": currentWindow
        ? ["job-1", "job-2", "job-3", "job-4", "job-5"]
        : ["job-1", "job-2"],
    },
    roleFamilyJobIds: {
      "ai-product": ["job-1", "job-2"],
      "ai-solutions": ["job-3"],
      "ai-engineering": currentWindow ? ["job-4"] : [],
      "data-science": currentWindow ? ["job-5"] : [],
      "people-analytics": currentWindow ? ["job-6"] : [],
    },
  };
});
