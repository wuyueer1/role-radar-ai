import { useEffect, useState } from "react";
import { loadSnapshot, SnapshotLoadError } from "./data/loadSnapshot";
import { parseMarketSnapshot } from "./domain/schemas";
import type { MarketSnapshot } from "./domain/types";
import { useJobExplorer, type ExplorerJob } from "./state/useJobExplorer";

interface RoleRadarAppProps {
  initialSnapshot?: unknown;
  fetcher?: typeof fetch;
}

type DataState =
  | { phase: "loading"; snapshot: null; message: null }
  | { phase: "error"; snapshot: null; message: string }
  | { phase: "ready"; snapshot: MarketSnapshot; message: null };

const EMPTY_JOBS: ExplorerJob[] = [];

const initialDataState = (value: unknown): DataState => {
  if (value === undefined) return { phase: "loading", snapshot: null, message: null };
  try {
    return { phase: "ready", snapshot: parseMarketSnapshot(value), message: null };
  } catch {
    return {
      phase: "error",
      snapshot: null,
      message: new SnapshotLoadError().message,
    };
  }
};

export function RoleRadarApp({ initialSnapshot, fetcher = fetch }: RoleRadarAppProps) {
  const [data, setData] = useState<DataState>(() => initialDataState(initialSnapshot));
  const [retryKey, setRetryKey] = useState(0);
  const explorer = useJobExplorer(data.snapshot?.jobs ?? EMPTY_JOBS);

  useEffect(() => {
    if (initialSnapshot !== undefined) return;
    let cancelled = false;
    void loadSnapshot(fetcher).then(
      (snapshot) => {
        if (!cancelled) setData({ phase: "ready", snapshot, message: null });
      },
      (error) => {
        if (cancelled) return;
        const message =
          error instanceof SnapshotLoadError
            ? error.message
            : new SnapshotLoadError().message;
        setData({ phase: "error", snapshot: null, message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, initialSnapshot, retryKey]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="app-header">
        <div>
          <p className="eyebrow">AI JOB INTELLIGENCE / PUBLIC PORTFOLIO</p>
          <h1>
            RoleRadar <span>AI</span>
          </h1>
          <p>把招聘市场变成可解释的个人机会</p>
        </div>
        <button type="button">分析一条 JD</button>
      </header>
      <main id="main-content" aria-busy={data.phase === "loading"}>
        {data.phase === "loading" ? <p>正在读取最近成功的岗位快照…</p> : null}
        {data.phase === "error" ? (
          <div role="alert">
            <p>{data.message}</p>
            <button
              type="button"
              onClick={() => {
                setData({ phase: "loading", snapshot: null, message: null });
                setRetryKey((value) => value + 1);
              }}
            >
              重试读取
            </button>
          </div>
        ) : null}
        {data.phase === "ready" ? (
          <section aria-label="岗位数据已就绪">
            <p aria-live="polite">已载入 {explorer.visibleJobs.length} 个真实岗位</p>
            {explorer.selectedJob ? (
              <p>
                当前选择：{explorer.selectedJob.company} · {explorer.selectedJob.title}
              </p>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
