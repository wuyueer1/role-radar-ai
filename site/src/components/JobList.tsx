import type { ExplorerJob } from "../state/useJobExplorer";

interface JobListProps {
  jobs: ExplorerJob[];
  selectedId?: string;
  statusMessage?: string;
  onSelect: (jobId: string) => void;
}

const updatedLabel = (value: string | null, fallback: string): string =>
  new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(
    new Date(value ?? fallback),
  );

export function JobList({ jobs, selectedId, statusMessage, onSelect }: JobListProps) {
  return (
    <div className="job-results">
      <div className="results-heading">
        <p className="eyebrow">LIVE ROLES / EXPLAINABLE RANKING</p>
        <p role="status" aria-live="polite">
          {statusMessage ? `${statusMessage} · ` : ""}找到 {jobs.length} 个岗位
        </p>
      </div>
      <div className="job-list">
        {jobs.length === 0 ? (
          <div className="empty-state">
            <h3>没有符合组合条件的岗位</h3>
            <p>试试降低最低匹配分，或切换到全部地点。</p>
          </div>
        ) : null}
        {jobs.map((job) => (
          <article className="job-row" data-testid="job-row" key={job.id}>
            <button
              aria-pressed={selectedId === job.id}
              className="job-row-button"
              type="button"
              onClick={() => onSelect(job.id)}
            >
              <span className="job-row-topline">
                <span>{job.company}</span>
                <span>{job.source.toUpperCase()}</span>
              </span>
              <strong>{job.title}</strong>
              <span className="job-row-meta">
                {job.locations.slice(0, 2).join(" · ")} · 更新 {updatedLabel(job.updatedAt, job.fetchedAt)}
              </span>
              <span className="tag-row">
                {job.skills.slice(0, 3).map((skill) => (
                  <span className="skill-tag" key={skill}>
                    {skill.replaceAll("-", " ")}
                  </span>
                ))}
              </span>
              <span className="match-orbit" aria-label={`匹配分 ${job.intelligence.matchScore}`}>
                {job.intelligence.matchScore}
              </span>
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
