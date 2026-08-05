import { createHash, randomUUID } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import registryJson from "../data/source-registry.json";
import {
  parseMarketSnapshot,
  parseSourceHealth,
  roleFamilySchema,
} from "../src/domain/schemas";
import type { DailyMarketRecord } from "../src/domain/trends";
import type { MarketSnapshot, SourceHealth } from "../src/domain/types";
import type { SourceRegistryEntry } from "./adapters/types";
import {
  bindRegistrySources,
  buildSnapshot,
  canonicalJson,
} from "./build-snapshot";

const nonEmpty = z.string().trim().min(1);
const dailyMarketRecordSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    jobIds: z.array(nonEmpty),
    skillJobIds: z.record(nonEmpty, z.array(nonEmpty)),
    roleFamilyJobIds: z.partialRecord(roleFamilySchema, z.array(nonEmpty)),
  })
  .strict();

export const parseHistory = (input: unknown): DailyMarketRecord[] =>
  z.array(dailyMarketRecordSchema).max(60).parse(input) as DailyMarketRecord[];

interface SnapshotArtifacts {
  snapshot: unknown;
  history: unknown;
  health: unknown;
}

interface ValidatedArtifacts {
  snapshot: MarketSnapshot;
  history: DailyMarketRecord[];
  health: SourceHealth[];
}

const revisionFor = (snapshot: MarketSnapshot): string => {
  const { dataRevision, ...body } = snapshot;
  void dataRevision;
  return createHash("sha256").update(canonicalJson(body)).digest("hex");
};

const validateArtifacts = (artifacts: SnapshotArtifacts): ValidatedArtifacts => {
  const snapshot = parseMarketSnapshot(artifacts.snapshot);
  const history = parseHistory(artifacts.history);
  const health = parseSourceHealth(artifacts.health);
  if (revisionFor(snapshot) !== snapshot.dataRevision) {
    throw new Error("Snapshot dataRevision does not match its canonical body");
  }
  if (canonicalJson(snapshot.sourceHealth) !== canonicalJson(health)) {
    throw new Error("Standalone source health does not match current snapshot");
  }
  return { snapshot, history, health };
};

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const readJson = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, "utf8"));

const directoryExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export async function publishSnapshotArtifacts(
  dataDir: string,
  artifacts: SnapshotArtifacts,
): Promise<ValidatedArtifacts> {
  const parent = dirname(dataDir);
  const name = basename(dataDir);
  const id = randomUUID();
  const nextDir = join(parent, `.${name}-next-${id}`);
  const previousDir = join(parent, `.${name}-previous-${id}`);
  await mkdir(parent, { recursive: true });
  await mkdir(nextDir);

  let movedPrevious = false;
  try {
    await Promise.all([
      writeFile(join(nextDir, "current.json"), json(artifacts.snapshot), "utf8"),
      writeFile(join(nextDir, "history.json"), json(artifacts.history), "utf8"),
      writeFile(join(nextDir, "source-health.json"), json(artifacts.health), "utf8"),
    ]);
    const validated = validateArtifacts({
      snapshot: await readJson(join(nextDir, "current.json")),
      history: await readJson(join(nextDir, "history.json")),
      health: await readJson(join(nextDir, "source-health.json")),
    });

    if (await directoryExists(dataDir)) {
      await rename(dataDir, previousDir);
      movedPrevious = true;
    }
    try {
      await rename(nextDir, dataDir);
    } catch (error) {
      if (movedPrevious) await rename(previousDir, dataDir);
      movedPrevious = false;
      throw error;
    }
    if (movedPrevious) {
      await rm(previousDir, { recursive: true, force: true });
      movedPrevious = false;
    }
    return validated;
  } finally {
    await rm(nextDir, { recursive: true, force: true });
    if (movedPrevious && !(await directoryExists(dataDir))) {
      await rename(previousDir, dataDir);
      movedPrevious = false;
    }
  }
}

const readOptional = async (path: string): Promise<unknown | null> => {
  try {
    return await readJson(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
};

export async function runPipeline(
  dataDir = fileURLToPath(new URL("../public/data", import.meta.url)),
): Promise<ValidatedArtifacts> {
  const previousJson = await readOptional(join(dataDir, "current.json"));
  const historyJson = await readOptional(join(dataDir, "history.json"));
  const previous = previousJson ? parseMarketSnapshot(previousJson) : null;
  const history = historyJson ? parseHistory(historyJson) : [];
  const result = await buildSnapshot({
    now: new Date(),
    adapters: bindRegistrySources(registryJson as SourceRegistryEntry[]),
    previous,
    history,
  });
  return publishSnapshotArtifacts(dataDir, {
    snapshot: result.snapshot,
    history: result.history,
    health: result.health,
  });
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  try {
    const result = await runPipeline();
    console.log(
      `Published ${result.snapshot.jobs.length} jobs from ${result.health.length} reviewed sources at ${result.snapshot.snapshotAt}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Unknown data pipeline failure");
    process.exitCode = 1;
  }
}
