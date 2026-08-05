import { createHash } from "node:crypto";
import profileJson from "../data/candidate-profile.json";
import { buildClusterGraph, type ClusterGraph } from "../src/domain/clusters";
import { scoreJob } from "../src/domain/matching";
import { parseCandidateProfile, parseMarketSnapshot } from "../src/domain/schemas";
import { classifyRoleFamily, extractSkills } from "../src/domain/taxonomy";
import {
  computeTrends,
  type DailyMarketRecord,
  type MarketTrends,
} from "../src/domain/trends";
import type {
  CandidateProfile,
  MarketSnapshot,
  NormalizedJob,
  RoleFamily,
  SourceHealth,
} from "../src/domain/types";
import { greenhouseAdapter } from "./adapters/greenhouse";
import { leverAdapter } from "./adapters/lever";
import type {
  JobSourceAdapter,
  RawSourceJob,
  SourceRegistryEntry,
} from "./adapters/types";
import { dedupeJobs } from "./dedupe";
import {
  scoreSemanticFit,
  type SemanticFitResult,
} from "./embeddings/e5-provider";
import { normalizeRawJob } from "./normalize";

export interface SourceBinding {
  entry: SourceRegistryEntry;
  adapter: JobSourceAdapter;
}

export type SemanticProvider = (
  profile: CandidateProfile,
  jobs: NormalizedJob[],
) => Promise<SemanticFitResult>;

export interface BuildSnapshotInput {
  now: Date;
  adapters: SourceBinding[];
  previous?: MarketSnapshot | null;
  history?: DailyMarketRecord[];
  profile?: CandidateProfile;
  semanticProvider?: SemanticProvider;
}

export interface BuildSnapshotResult {
  snapshot: MarketSnapshot;
  history: DailyMarketRecord[];
  health: SourceHealth[];
  clusters: ClusterGraph;
  trends: MarketTrends;
}

const adapterByProvider: Record<SourceRegistryEntry["provider"], JobSourceAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
};

export const bindRegistrySources = (entries: SourceRegistryEntry[]): SourceBinding[] =>
  entries.map((entry) => ({ entry, adapter: adapterByProvider[entry.provider] }));

const isReviewed = (entry: SourceRegistryEntry): boolean => {
  if (!entry.enabled || !/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewedAt)) return false;
  try {
    return new URL(entry.termsUrl).protocol === "https:";
  } catch {
    return false;
  }
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
};

export const canonicalJson = (value: unknown): string => JSON.stringify(stableValue(value));

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const uniqueSorted = (values: string[]): string[] => [...new Set(values)].sort();

export const jobsToDailyRecord = (
  date: string,
  jobs: NormalizedJob[],
): DailyMarketRecord => {
  const skillJobIds: Record<string, string[]> = {};
  const roleFamilyJobIds: Partial<Record<RoleFamily, string[]>> = {};
  for (const job of jobs) {
    for (const skill of uniqueSorted(job.skills)) {
      skillJobIds[skill] = [...(skillJobIds[skill] ?? []), job.id];
    }
    roleFamilyJobIds[job.roleFamily] = [
      ...(roleFamilyJobIds[job.roleFamily] ?? []),
      job.id,
    ];
  }
  Object.keys(skillJobIds).forEach((skill) => {
    skillJobIds[skill] = uniqueSorted(skillJobIds[skill]);
  });
  Object.keys(roleFamilyJobIds).forEach((family) => {
    const role = family as RoleFamily;
    roleFamilyJobIds[role] = uniqueSorted(roleFamilyJobIds[role] ?? []);
  });
  return {
    date,
    jobIds: uniqueSorted(jobs.map((job) => job.id)),
    skillJobIds: Object.fromEntries(
      Object.entries(skillJobIds).sort(([left], [right]) => left.localeCompare(right)),
    ),
    roleFamilyJobIds: Object.fromEntries(
      Object.entries(roleFamilyJobIds).sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
};

const upsertHistory = (
  history: DailyMarketRecord[],
  current: DailyMarketRecord,
): DailyMarketRecord[] =>
  [...history.filter((record) => record.date !== current.date), current]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-60);

const nextDate = (date: string): string => {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

const differenceCount = (left: string[], right: string[]): number => {
  const rightIds = new Set(right);
  return new Set(left.filter((id) => !rightIds.has(id))).size;
};

const enrichJob = (job: NormalizedJob): NormalizedJob => {
  const skills = extractSkills(`${job.title}\n${job.description}`);
  return {
    ...job,
    skills,
    roleFamily: classifyRoleFamily(job.title, skills),
  };
};

interface SettledSource {
  rawJobs: RawSourceJob[];
  health: SourceHealth;
}

const fetchSource = async (
  binding: SourceBinding,
  snapshotAt: string,
): Promise<SettledSource> => {
  try {
    const rawJobs = await binding.adapter.fetch(binding.entry);
    if (rawJobs.length === 0) throw new Error("source returned zero jobs");
    return {
      rawJobs,
      health: {
        sourceId: binding.entry.id,
        company: binding.entry.company,
        status: "ok",
        fetchedAt: snapshotAt,
        jobCount: rawJobs.length,
        message: "Reviewed source contract valid",
      },
    };
  } catch (error) {
    return {
      rawJobs: [],
      health: {
        sourceId: binding.entry.id,
        company: binding.entry.company,
        status: "failed",
        fetchedAt: snapshotAt,
        jobCount: 0,
        message: error instanceof Error ? error.message : "Unknown source failure",
      },
    };
  }
};

const previousAsRecord = (snapshot: MarketSnapshot): DailyMarketRecord =>
  jobsToDailyRecord(
    snapshot.snapshotAt.slice(0, 10),
    snapshot.jobs.map(({ intelligence, ...job }) => {
      void intelligence;
      return job;
    }),
  );

export async function buildSnapshot(
  input: BuildSnapshotInput,
): Promise<BuildSnapshotResult> {
  if (Number.isNaN(input.now.getTime())) throw new Error("Invalid snapshot timestamp");
  const snapshotAt = input.now.toISOString();
  const reviewed = input.adapters.filter(({ entry }) => isReviewed(entry));
  if (reviewed.length === 0) throw new Error("No enabled reviewed sources");

  const settled = await Promise.all(
    reviewed.map((binding) => fetchSource(binding, snapshotAt)),
  );
  const health = settled
    .map((result) => result.health)
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const normalized = settled.flatMap((result) => result.rawJobs).map(normalizeRawJob);
  const jobs = dedupeJobs(normalized)
    .jobs.map(enrichJob)
    .filter((job) => job.roleFamily !== "other" && job.status === "active")
    .sort((left, right) => left.id.localeCompare(right.id));
  if (jobs.length === 0) throw new Error("No publishable target AI jobs");

  const profile = input.profile ?? parseCandidateProfile(profileJson);
  const semantic = await (input.semanticProvider ?? scoreSemanticFit)(profile, jobs);
  const semanticByJob = new Map(semantic.scores.map((score) => [score.jobId, score]));
  const scoredJobs = jobs
    .map((job) => {
      const score = semanticByJob.get(job.id);
      if (!score) throw new Error(`Missing semantic score for ${job.id}`);
      return {
        ...job,
        intelligence: scoreJob(job, profile, {
          semanticPercentile: score.percentile,
          mode: semantic.mode,
          analyzedAt: snapshotAt,
          modelRevision: semantic.modelRevision,
        }),
      };
    })
    .sort(
      (left, right) =>
        right.intelligence.matchScore - left.intelligence.matchScore ||
        left.id.localeCompare(right.id),
    );

  const currentDate = snapshotAt.slice(0, 10);
  const startingHistory = input.history?.length
    ? input.history
    : input.previous
      ? [previousAsRecord(input.previous)]
      : [];
  const history = upsertHistory(startingHistory, jobsToDailyRecord(currentDate, jobs));
  const trends = computeTrends(history, nextDate(currentDate));
  const currentIds = jobs.map((job) => job.id);
  const previousIds = input.previous?.jobs.map((job) => job.id) ?? [];

  const snapshotBody = {
    schemaVersion: 1 as const,
    snapshotAt,
    sourceHealth: health,
    activeJobCount: jobs.length,
    newJobCount: differenceCount(currentIds, previousIds),
    removedJobCount: differenceCount(previousIds, currentIds),
    roleFamilyStats: trends.roleFamilyStats,
    skillStats: trends.skillStats.map(({ skillId, jobCount, share, delta7d }) => ({
      skillId,
      jobCount,
      share,
      delta7d,
    })),
    jobs: scoredJobs,
  };
  const snapshot = parseMarketSnapshot({
    ...snapshotBody,
    dataRevision: sha256(canonicalJson(snapshotBody)),
  });
  const roleDeltas = Object.fromEntries(
    snapshot.roleFamilyStats.map((item) => [item.roleFamily, item.delta7d]),
  );

  return {
    snapshot,
    history,
    health,
    clusters: buildClusterGraph(jobs, roleDeltas),
    trends,
  };
}
