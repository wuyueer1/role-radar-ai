import type { MarketSnapshot } from "../domain/types";
import type { SnapshotFreshness } from "../data/loadSnapshot";

interface AppHeaderProps {
  snapshot: MarketSnapshot;
  freshness: SnapshotFreshness;
  onOpenSources: () => void;
  onOpenJd: () => void;
}

const timestamp = (value: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));

export function AppHeader({
  snapshot,
  freshness,
  onOpenSources,
  onOpenJd,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-rail">
        <p className="wordmark">ROLE / RADAR</p>
        <p className="header-meta">
          数据更新 {timestamp(snapshot.snapshotAt)}
          <span aria-hidden="true">·</span>
          REV {snapshot.dataRevision.slice(0, 10)}
        </p>
        <button className="text-button" type="button" onClick={onOpenSources}>
          查看数据源状态
        </button>
      </div>
      <div className="hero-grid">
        <div>
          <p className="eyebrow">AI JOB INTELLIGENCE / PUBLIC PORTFOLIO</p>
          <h1>
            RoleRadar <span>AI</span>
          </h1>
          <p className="hero-promise">把招聘市场变成可解释的个人机会</p>
        </div>
        <div className="hero-actions">
          <span className={`freshness-pill freshness-pill--${freshness.state}`}>
            {freshness.label}
          </span>
          <p>
            真实岗位 · 可追溯证据
            <br />
            本地 JD 分析不上传
          </p>
          <button className="primary-action" type="button" onClick={onOpenJd}>
            分析一条 JD
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </header>
  );
}
