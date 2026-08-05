import { parseMarketSnapshot } from "../domain/schemas";
import type { MarketSnapshot } from "../domain/types";

export class SnapshotLoadError extends Error {
  constructor() {
    super("暂时无法读取岗位快照，请稍后重试。");
    this.name = "SnapshotLoadError";
  }
}

export interface SnapshotFreshness {
  state: "fresh" | "delayed" | "stale";
  ageHours: number;
  label: "最新" | "更新延迟" | "数据过期";
}

export function getFreshness(
  snapshotAt: string,
  now = new Date(),
): SnapshotFreshness {
  const timestamp = Date.parse(snapshotAt);
  if (!Number.isFinite(timestamp) || Number.isNaN(now.getTime())) {
    throw new SnapshotLoadError();
  }
  const ageHours = Math.max(0, (now.getTime() - timestamp) / 3_600_000);
  if (ageHours <= 8) return { state: "fresh", ageHours, label: "最新" };
  if (ageHours <= 24) return { state: "delayed", ageHours, label: "更新延迟" };
  return { state: "stale", ageHours, label: "数据过期" };
}

export async function loadSnapshot(fetcher: typeof fetch = fetch): Promise<MarketSnapshot> {
  try {
    const response = await fetcher("./data/current.json", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("snapshot request failed");
    return parseMarketSnapshot(await response.json());
  } catch {
    throw new SnapshotLoadError();
  }
}
