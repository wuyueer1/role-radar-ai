import { describe, expect, it, vi } from "vitest";
import {
  getFreshness,
  loadSnapshot,
  SnapshotLoadError,
} from "../../src/data/loadSnapshot";
import { validSnapshot } from "../fixtures/market-snapshot";

describe("snapshot freshness", () => {
  const now = new Date("2026-08-05T12:00:00.000Z");

  it("marks eight hours as latest and the next millisecond delayed", () => {
    expect(getFreshness("2026-08-05T04:00:00.000Z", now).state).toBe("fresh");
    expect(getFreshness("2026-08-05T03:59:59.999Z", now).state).toBe("delayed");
  });

  it("marks twenty-four hours as delayed and the next millisecond stale", () => {
    expect(getFreshness("2026-08-04T12:00:00.000Z", now).state).toBe("delayed");
    expect(getFreshness("2026-08-04T11:59:59.999Z", now).state).toBe("stale");
  });

  it("loads only schema-valid snapshots and hides transport details", async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify(validSnapshot), { status: 200 }));
    await expect(loadSnapshot(ok)).resolves.toMatchObject({ activeJobCount: 2 });
    expect(ok).toHaveBeenCalledWith("./data/current.json", expect.any(Object));

    const failed = vi.fn(async () => new Response("internal path /srv/data", { status: 503 }));
    await expect(loadSnapshot(failed)).rejects.toEqual(expect.any(SnapshotLoadError));
    await expect(loadSnapshot(failed)).rejects.not.toThrow(/srv|503/);
  });
});
