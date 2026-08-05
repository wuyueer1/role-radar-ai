import { useRef } from "react";
import type { SourceHealth } from "../domain/types";
import { useDialogFocus } from "./useDialogFocus";

interface SourceHealthDialogProps {
  open: boolean;
  sources: SourceHealth[];
  onClose: () => void;
}

const statusLabels: Record<SourceHealth["status"], string> = {
  ok: "正常",
  partial: "部分可用",
  failed: "失败",
};

const timestamp = (value: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));

export function SourceHealthDialog({ open, sources, onClose }: SourceHealthDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(open, dialogRef, onClose);
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        aria-labelledby="source-health-title"
        aria-modal="true"
        className="source-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">SOURCE CONTRACTS / LAST FETCH</p>
            <h2 id="source-health-title">数据源健康状态</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭数据源状态">
            ×
          </button>
        </div>
        <p className="dialog-intro">
          这里只展示经过条款复核并通过 schema 检查的官方公开招聘源。单源失败不会覆盖上一版成功数据。
        </p>
        <div className="source-list">
          {sources.map((source) => (
            <article className="source-row" key={source.sourceId}>
              <div>
                <h3>{source.company}</h3>
                <p>{source.sourceId}</p>
              </div>
              <span className={`status-badge status-badge--${source.status}`}>
                {statusLabels[source.status]}
              </span>
              <strong>{source.jobCount} 条原始岗位</strong>
              <p className="source-message">{source.message}</p>
              <time dateTime={source.fetchedAt}>{timestamp(source.fetchedAt)}</time>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
