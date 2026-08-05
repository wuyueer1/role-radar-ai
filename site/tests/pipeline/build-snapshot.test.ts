// @vitest-environment node
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../../pipeline/build-snapshot";
import { parseHistory, publishSnapshotArtifacts } from "../../pipeline/run";
import { parseMarketSnapshot } from "../../src/domain/schemas";
import {
  failingAdapter,
  FIXED_SEMANTIC_PROVIDER,
  PREVIOUS_SNAPSHOT,
  successfulAdapter,
} from "../fixtures/pipeline";

describe("snapshot orchestration", () => {
  it("publishes valid jobs when one source fails and records source health", async () => {
    const input = {
      now: new Date("2026-08-05T04:00:00.000Z"),
      adapters: [successfulAdapter, failingAdapter],
      previous: PREVIOUS_SNAPSHOT,
      semanticProvider: FIXED_SEMANTIC_PROVIDER,
    };

    const result = await buildSnapshot(input);
    const repeated = await buildSnapshot(input);

    expect(result.snapshot.jobs.length).toBeGreaterThan(0);
    expect(result.snapshot.sourceHealth).toContainEqual(
      expect.objectContaining({ sourceId: "fixture-lever", status: "failed", jobCount: 0 }),
    );
    expect(result.snapshot.sourceHealth).toContainEqual(
      expect.objectContaining({ sourceId: "fixture-greenhouse", status: "ok", jobCount: 1 }),
    );
    expect(result.snapshot.dataRevision).toMatch(/^[a-f0-9]{64}$/);
    expect(result.snapshot.dataRevision).toBe(repeated.snapshot.dataRevision);
    expect(() => parseMarketSnapshot(result.snapshot)).not.toThrow();
    expect(() => parseHistory(result.history)).not.toThrow();
    expect(result.history.at(-1)?.date).toBe("2026-08-05");
  });

  it("leaves last-good data untouched when prepared artifacts fail validation", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "role-radar-snapshot-"));
    const dataDir = join(workspace, "data");
    await mkdir(dataDir);
    await writeFile(join(dataDir, "current.json"), '{"sentinel":"last-good"}\n');

    try {
      await expect(
        publishSnapshotArtifacts(dataDir, {
          snapshot: PREVIOUS_SNAPSHOT,
          history: [{ date: "not-a-date" }],
          health: PREVIOUS_SNAPSHOT.sourceHealth,
        }),
      ).rejects.toThrow();
      expect(await readFile(join(dataDir, "current.json"), "utf8")).toContain("last-good");
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  });
});

describe("published seed contract", () => {
  it("ships at least two healthy sources and twenty explainable HTTPS jobs", async () => {
    const currentPath = new URL("../../public/data/current.json", import.meta.url);
    const snapshot = parseMarketSnapshot(JSON.parse(await readFile(currentPath, "utf8")));

    expect(snapshot.sourceHealth.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.sourceHealth.every((source) => source.status === "ok")).toBe(true);
    expect(snapshot.jobs.length).toBeGreaterThanOrEqual(20);
    expect(
      snapshot.jobs.every(
        (job) =>
          job.sourceUrl.startsWith("https://") &&
          job.applyUrl.startsWith("https://") &&
          job.sourceUrls.every((url) => url.startsWith("https://")) &&
          job.intelligence.explanation.trim().length > 0,
      ),
    ).toBe(true);
  });
});
