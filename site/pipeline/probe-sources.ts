import { pathToFileURL } from "node:url";
import registry from "../data/source-registry.json";
import { greenhouseAdapter } from "./adapters/greenhouse";
import { leverAdapter } from "./adapters/lever";
import type { JobSourceAdapter, SourceRegistryEntry } from "./adapters/types";

export interface ProbeResult {
  id: string;
  status: "ok" | "failed";
  count: number;
  message: string;
}

interface ProbeOptions {
  fetcher?: typeof fetch;
  timeoutMs?: number;
  stdout?: (message: string) => void;
  stderr?: (message: string) => void;
}

const adapters: Record<SourceRegistryEntry["provider"], JobSourceAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
};

export async function probeSources(
  entries: SourceRegistryEntry[],
  options: ProbeOptions = {},
): Promise<{ ok: boolean; results: ProbeResult[] }> {
  const {
    fetcher = fetch,
    timeoutMs = 15_000,
    stdout = console.log,
    stderr = console.error,
  } = options;
  const results: ProbeResult[] = [];

  for (const entry of entries.filter((item) => item.enabled)) {
    try {
      const timedFetch: typeof fetch = (input, init) =>
        fetcher(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      const jobs = await adapters[entry.provider].fetch(entry, timedFetch);
      if (jobs.length === 0) throw new Error("source returned zero jobs");
      const result: ProbeResult = {
        id: entry.id,
        status: "ok",
        count: jobs.length,
        message: "contract valid",
      };
      results.push(result);
      stdout(`PASS ${entry.id} ${jobs.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown source error";
      results.push({ id: entry.id, status: "failed", count: 0, message });
      stderr(`FAIL ${entry.id} ${message}`);
    }
  }

  return { ok: results.every((result) => result.status === "ok"), results };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  const result = await probeSources(registry as SourceRegistryEntry[]);
  if (!result.ok) process.exitCode = 1;
}
