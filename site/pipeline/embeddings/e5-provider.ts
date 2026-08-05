import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { CandidateProfile, NormalizedJob } from "../../src/domain/types";

interface RawSemanticScore {
  jobId: string;
  cosine: number;
}

interface RawE5Output {
  modelRevision: string;
  scores: RawSemanticScore[];
}

interface E5Input {
  profile: CandidateProfile;
  jobs: NormalizedJob[];
}

export type E5Runner = (input: E5Input) => Promise<unknown>;

export interface SemanticFitResult {
  mode: "e5" | "rules-fallback";
  modelRevision: string;
  scores: Array<{ jobId: string; cosine: number; percentile: number }>;
  fallbackReason?: string;
}

export const pythonEnvironment = (
  environment: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv => ({
  ...environment,
  PYTHONNOUSERSITE: "1",
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateOutput = (value: unknown, jobs: NormalizedJob[]): RawE5Output => {
  if (!isRecord(value) || typeof value.modelRevision !== "string" || !Array.isArray(value.scores)) {
    throw new Error("invalid E5 output envelope");
  }
  const scores = value.scores.map((item, index) => {
    if (
      !isRecord(item) ||
      typeof item.jobId !== "string" ||
      typeof item.cosine !== "number" ||
      !Number.isFinite(item.cosine) ||
      item.cosine < -1 ||
      item.cosine > 1
    ) {
      throw new Error(`invalid E5 score at index ${index}`);
    }
    return { jobId: item.jobId, cosine: item.cosine };
  });
  const expectedIds = jobs.map((job) => job.id).sort();
  const actualIds = scores.map((score) => score.jobId).sort();
  if (expectedIds.length !== actualIds.length || expectedIds.some((id, index) => id !== actualIds[index])) {
    throw new Error("E5 output job IDs do not match input");
  }
  return { modelRevision: value.modelRevision, scores };
};

const percentiles = (scores: RawSemanticScore[]): Map<string, number> => {
  if (scores.length === 0) return new Map();
  if (scores.length === 1) return new Map([[scores[0].jobId, 100]]);
  const sorted = [...scores].sort((left, right) => left.cosine - right.cosine || left.jobId.localeCompare(right.jobId));
  const result = new Map<string, number>();
  let index = 0;
  while (index < sorted.length) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1].cosine === sorted[index].cosine) end += 1;
    const averageRank = (index + 1 + (end + 1)) / 2;
    const percentile = Math.round(((averageRank - 1) / (sorted.length - 1)) * 100);
    for (let cursor = index; cursor <= end; cursor += 1) {
      result.set(sorted[cursor].jobId, percentile);
    }
    index = end + 1;
  }
  return result;
};

const features = (value: string): Map<string, number> => {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ");
  const result = new Map<string, number>();
  const add = (feature: string) => result.set(feature, (result.get(feature) ?? 0) + 1);
  normalized.match(/[a-z0-9+#.-]{2,}/g)?.forEach((word) => add(`w:${word}`));
  const compact = normalized.replace(/\s+/g, "");
  for (let index = 0; index <= compact.length - 3; index += 1) add(`c:${compact.slice(index, index + 3)}`);
  return result;
};

const cosine = (left: Map<string, number>, right: Map<string, number>): number => {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  left.forEach((value, key) => {
    dot += value * (right.get(key) ?? 0);
    leftNorm += value * value;
  });
  right.forEach((value) => {
    rightNorm += value * value;
  });
  return leftNorm === 0 || rightNorm === 0 ? 0 : dot / Math.sqrt(leftNorm * rightNorm);
};

const fallbackScores = (profile: CandidateProfile, jobs: NormalizedJob[]): RawSemanticScore[] => {
  const candidate = features(
    profile.evidence.map((item) => `${item.label} ${item.excerpt}`).join("\n"),
  );
  return jobs.map((job) => ({
    jobId: job.id,
    cosine: Number(
      cosine(
        candidate,
        features(`${job.title}\n${job.description}\n${job.requirements.join("\n")}`),
      ).toFixed(6),
    ),
  }));
};

export const runPythonE5: E5Runner = (input) =>
  new Promise((resolve, reject) => {
    const script = fileURLToPath(new URL("./e5.py", import.meta.url));
    const child = spawn("python3", [script], {
      env: pythonEnvironment(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() => reject(new Error("E5 process timed out after 120 seconds")));
    }, 120_000);
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => finish(() => reject(error)));
    child.on("close", (code) =>
      finish(() => {
        if (code !== 0) return reject(new Error(`E5 exited ${code}: ${stderr.trim()}`));
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error("E5 returned invalid JSON"));
        }
      }),
    );
    child.stdin.end(JSON.stringify(input));
  });

export async function scoreSemanticFit(
  profile: CandidateProfile,
  jobs: NormalizedJob[],
  runner: E5Runner = runPythonE5,
): Promise<SemanticFitResult> {
  try {
    const output = validateOutput(await runner({ profile, jobs }), jobs);
    const ranks = percentiles(output.scores);
    const byId = new Map(output.scores.map((score) => [score.jobId, score]));
    return {
      mode: "e5",
      modelRevision: output.modelRevision,
      scores: jobs.map((job) => ({
        jobId: job.id,
        cosine: byId.get(job.id)?.cosine ?? 0,
        percentile: ranks.get(job.id) ?? 0,
      })),
    };
  } catch (error) {
    const rawScores = fallbackScores(profile, jobs);
    const ranks = percentiles(rawScores);
    return {
      mode: "rules-fallback",
      modelRevision: "tfidf-v1",
      scores: rawScores.map((score) => ({ ...score, percentile: ranks.get(score.jobId) ?? 0 })),
      fallbackReason: error instanceof Error ? error.message : "unknown E5 failure",
    };
  }
}
