import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ClusterMap } from "./components/ClusterMap";
import { JdAnalyzer } from "./components/JdAnalyzer";
import { JobDetail } from "./components/JobDetail";
import { JobFilters } from "./components/JobFilters";
import { JobList } from "./components/JobList";
import { MarketOverview } from "./components/MarketOverview";
import { SourceHealthDialog } from "./components/SourceHealthDialog";
import { getFreshness, loadSnapshot, SnapshotLoadError } from "./data/loadSnapshot";
import { parseMarketSnapshot } from "./domain/schemas";
import type { MarketSnapshot, RoleFamily } from "./domain/types";
import { useJobExplorer, type ExplorerJob } from "./state/useJobExplorer";

interface RoleRadarAppProps {
  initialSnapshot?: unknown;
  fetcher?: typeof fetch;
  now?: Date;
}

type DataState =
  | { phase: "loading"; snapshot: null; message: null }
  | { phase: "error"; snapshot: null; message: string }
  | { phase: "ready"; snapshot: MarketSnapshot; message: null };

const EMPTY_JOBS: ExplorerJob[] = [];

const useCompactLayout = (): boolean => {
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 1023px)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(max-width: 1023px)");
    const update = (event: MediaQueryListEvent) => setCompact(event.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return compact;
};

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

export function RoleRadarApp({ initialSnapshot, fetcher = fetch, now }: RoleRadarAppProps) {
  const [data, setData] = useState<DataState>(() => initialDataState(initialSnapshot));
  const [retryKey, setRetryKey] = useState(0);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [jdAnalyzerOpen, setJdAnalyzerOpen] = useState(false);
  const [clusterMessage, setClusterMessage] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const compactLayout = useCompactLayout();
  const roleGrowth = useMemo(
    () =>
      Object.fromEntries(
        (data.snapshot?.roleFamilyStats ?? []).map((item) => [item.roleFamily, item.delta7d]),
      ),
    [data.snapshot?.roleFamilyStats],
  );
  const explorer = useJobExplorer(data.snapshot?.jobs ?? EMPTY_JOBS, { roleGrowth });
  const closeSourceDialog = useCallback(() => setSourceDialogOpen(false), []);
  const closeJdAnalyzer = useCallback(() => setJdAnalyzerOpen(false), []);
  const clearClusterMessage = useCallback(() => setClusterMessage(""), []);
  const freshness = data.snapshot
    ? getFreshness(data.snapshot.snapshotAt, now ?? new Date())
    : null;

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
      {data.phase === "ready" ? (
        <AppHeader
          snapshot={data.snapshot}
          freshness={freshness!}
          onOpenSources={() => setSourceDialogOpen(true)}
          onOpenJd={() => setJdAnalyzerOpen(true)}
        />
      ) : (
        <header className="app-header app-header--loading">
          <div>
            <p className="eyebrow">AI JOB INTELLIGENCE / PUBLIC PORTFOLIO</p>
            <h1>
              RoleRadar <span>AI</span>
            </h1>
            <p className="hero-promise">把招聘市场变成可解释的个人机会</p>
          </div>
          <button className="primary-action" type="button" onClick={() => setJdAnalyzerOpen(true)}>
            分析一条 JD
          </button>
        </header>
      )}
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
          <>
            <MarketOverview snapshot={data.snapshot} />
            <ClusterMap
              jobs={data.snapshot.jobs}
              roleDeltas={roleGrowth}
              selectedFamily={explorer.family}
              onSelect={(family: RoleFamily, label: string) => {
                explorer.setFamily(family);
                setClusterMessage(`已筛选 ${label}岗位簇`);
              }}
            />
            <section className="job-explorer" aria-labelledby="job-explorer-title">
              <div className="explorer-heading">
                <div>
                  <p className="eyebrow">OPPORTUNITY EXPLORER / SHAREABLE FILTERS</p>
                  <h2 id="job-explorer-title">从市场供给，找到值得行动的岗位</h2>
                </div>
                <p className="data-ready" aria-live="polite">
                  已载入 {explorer.visibleJobs.length} 个真实岗位
                </p>
              </div>
              <JobFilters
                query={explorer.query}
                location={explorer.location}
                family={explorer.family}
                source={explorer.source}
                sort={explorer.sort}
                minMatch={explorer.minMatch}
                freshness={freshness!}
                onQuery={(value) => { clearClusterMessage(); explorer.setQuery(value); }}
                onLocation={(value) => { clearClusterMessage(); explorer.setLocation(value); }}
                onFamily={(value) => { clearClusterMessage(); explorer.setFamily(value); }}
                onSource={(value) => { clearClusterMessage(); explorer.setSource(value); }}
                onSort={(value) => { clearClusterMessage(); explorer.setSort(value); }}
                onMinMatch={(value) => { clearClusterMessage(); explorer.setMinMatch(value); }}
              />
              <div className="explorer-layout">
                <JobList
                  jobs={explorer.visibleJobs}
                  selectedId={explorer.selectedJob?.id}
                  statusMessage={clusterMessage}
                  onSelect={(jobId) => {
                    explorer.selectJob(jobId);
                    if (compactLayout) setMobileDetailOpen(true);
                  }}
                />
                {!compactLayout && explorer.selectedJob ? (
                  <JobDetail job={explorer.selectedJob} />
                ) : null}
              </div>
            </section>
            {compactLayout && mobileDetailOpen && explorer.selectedJob ? (
              <JobDetail
                dialog
                job={explorer.selectedJob}
                onClose={() => setMobileDetailOpen(false)}
              />
            ) : null}
          </>
        ) : null}
      </main>
      <SourceHealthDialog
        open={sourceDialogOpen}
        sources={data.snapshot?.sourceHealth ?? []}
        onClose={closeSourceDialog}
      />
      <JdAnalyzer open={jdAnalyzerOpen} onClose={closeJdAnalyzer} fetcher={fetcher} />
    </div>
  );
}
