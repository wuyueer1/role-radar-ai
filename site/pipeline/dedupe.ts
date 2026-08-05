import type { NormalizedJob } from "../src/domain/types";

export interface DuplicateGroup {
  canonicalJobId: string;
  sourceIds: string[];
  sourceUrls: string[];
}

export interface DedupeResult {
  jobs: NormalizedJob[];
  duplicates: DuplicateGroup[];
}

const normalizeCompany = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/\b(incorporated|corporation|limited|inc|corp|llc|ltd|pte)\b\.?/g, "")
    .replace(/有限公司/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();

const trigrams = (value: string): Set<string> => {
  const normalized = `  ${value.normalize("NFKC").toLocaleLowerCase("en")}  `;
  const result = new Set<string>();
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    result.add(normalized.slice(index, index + 3));
  }
  return result;
};

const jaccard = (left: string, right: string): number => {
  const a = trigrams(left);
  const b = trigrams(right);
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 1 : intersection / union;
};

const sameJob = (left: NormalizedJob, right: NormalizedJob): boolean => {
  if (normalizeCompany(left.company) !== normalizeCompany(right.company)) return false;
  if (left.sourceJobId === right.sourceJobId) return true;
  if (left.contentFingerprint === right.contentFingerprint) return true;
  const leftKey = `${left.normalizedTitle}|${left.locations[0] ?? ""}`;
  const rightKey = `${right.normalizedTitle}|${right.locations[0] ?? ""}`;
  return jaccard(leftKey, rightKey) >= 0.92;
};

const later = (left: string | null, right: string | null): string | null => {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(left) >= Date.parse(right) ? left : right;
};

const uniqueSorted = (values: string[]): string[] => [...new Set(values)].sort();

const mergeJobs = (left: NormalizedJob, right: NormalizedJob): NormalizedJob => {
  const preferred =
    right.description.length > left.description.length ||
    (right.description.length === left.description.length && right.id.localeCompare(left.id) < 0)
      ? right
      : left;
  const fallback = preferred === left ? right : left;
  const applyUrl = preferred.applyUrl.startsWith("https://") ? preferred.applyUrl : fallback.applyUrl;

  return {
    ...preferred,
    applyUrl,
    sourceUrls: uniqueSorted([...left.sourceUrls, ...right.sourceUrls]),
    publishedAt: later(left.publishedAt, right.publishedAt),
    updatedAt: later(left.updatedAt, right.updatedAt),
    fetchedAt: later(left.fetchedAt, right.fetchedAt) ?? preferred.fetchedAt,
  };
};

export function dedupeJobs(input: NormalizedJob[]): DedupeResult {
  const groups: Array<{
    job: NormalizedJob;
    sourceIds: Set<string>;
    sourceUrls: Set<string>;
  }> = [];

  for (const job of [...input].sort((left, right) => left.id.localeCompare(right.id))) {
    const group = groups.find((candidate) => sameJob(candidate.job, job));
    if (!group) {
      groups.push({
        job,
        sourceIds: new Set([job.id]),
        sourceUrls: new Set(job.sourceUrls),
      });
      continue;
    }
    group.sourceIds.add(job.id);
    job.sourceUrls.forEach((url) => group.sourceUrls.add(url));
    group.job = mergeJobs(group.job, job);
  }

  return {
    jobs: groups.map((group) => group.job).sort((left, right) => left.id.localeCompare(right.id)),
    duplicates: groups
      .filter((group) => group.sourceIds.size > 1)
      .map((group) => ({
        canonicalJobId: group.job.id,
        sourceIds: uniqueSorted([...group.sourceIds]),
        sourceUrls: uniqueSorted([...group.sourceUrls]),
      })),
  };
}
