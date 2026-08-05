import { useRef } from "react";
import profileJson from "../../data/candidate-profile.json";
import { parseCandidateProfile } from "../domain/schemas";
import type { ComponentScores } from "../domain/types";
import type { ExplorerJob } from "../state/useJobExplorer";
import { useDialogFocus } from "./useDialogFocus";

interface JobDetailProps {
  job: ExplorerJob;
  dialog?: boolean;
  onClose?: () => void;
}

const profile = parseCandidateProfile(profileJson);
const scoreLabels: Array<[keyof ComponentScores, string]> = [
  ["skill", "核心技能覆盖"],
  ["evidence", "经验证据强度"],
  ["semantic", "语义相关度"],
  ["adjacency", "角色邻近度"],
  ["constraints", "明确约束匹配"],
];

const timestamp = (value: string): string =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(value));

export function JobDetail({ job, dialog = false, onClose = () => undefined }: JobDetailProps) {
  const detailRef = useRef<HTMLElement>(null);
  useDialogFocus(dialog, detailRef, onClose);
  const intelligence = job.intelligence;

  const content = (
    <>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">MATCH TRACE / NOT A HIRING PROBABILITY</p>
          <h2 id={`detail-${job.id}`}>{job.company} / {job.title}</h2>
          <p>{job.locations.join(" · ")}</p>
        </div>
        {dialog ? (
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭岗位详情">
            ×
          </button>
        ) : null}
      </div>

      <div className="detail-score">
        <strong>{intelligence.matchScore}</strong>
        <span>匹配分</span>
        <small>可复算的相对排序，不是录用概率</small>
      </div>

      <section className="score-breakdown" aria-label="五项匹配分量">
        {scoreLabels.map(([key, label]) => (
          <div className="score-row" key={key}>
            <span>{label}</span>
            <div className="score-track" aria-hidden="true">
              <span style={{ width: `${intelligence.componentScores[key]}%` }} />
            </div>
            <strong>{intelligence.componentScores[key]}</strong>
          </div>
        ))}
      </section>

      <section className="detail-section">
        <h3>岗位要求 ↔ 候选人证据</h3>
        <div className="evidence-pairs">
          {intelligence.matchedEvidence.length ? intelligence.matchedEvidence.map((match) => {
            const evidence = profile.evidence.find((item) => item.id === match.evidenceId);
            return (
              <article key={`${match.evidenceId}-${match.requirement}`}>
                <p>{match.requirement}</p>
                <span aria-hidden="true">↕</span>
                <blockquote>{evidence?.excerpt ?? "证据记录暂不可用"}</blockquote>
              </article>
            );
          }) : <p>当前岗位尚未提取出可直接映射的技能证据。</p>}
        </div>
      </section>

      <div className="detail-columns">
        <section className="detail-section">
          <h3>已验证优势</h3>
          <ul>{intelligence.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
        <section className="detail-section">
          <h3>待补证据</h3>
          <ul>{intelligence.gaps.length ? intelligence.gaps.map((item) => <li key={item}>{item}</li>) : <li>未识别到显著技能缺口</li>}</ul>
        </section>
      </div>

      {intelligence.hardBlockers.length ? (
        <section className="detail-section blocker-section">
          <h3>明确阻断条件</h3>
          <ul>{intelligence.hardBlockers.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>
      ) : null}

      <section className="detail-section method-section">
        <h3>分析口径与来源</h3>
        <p>{intelligence.explanation}</p>
        <dl>
          <div><dt>分析模式</dt><dd>{intelligence.analysisMode}</dd></div>
          <div><dt>模型 / 规则版本</dt><dd>{intelligence.modelRevision}</dd></div>
          <div><dt>抓取时间</dt><dd>{timestamp(job.fetchedAt)}</dd></div>
          <div><dt>分析时间</dt><dd>{timestamp(intelligence.analyzedAt)}</dd></div>
        </dl>
      </section>

      <section className="detail-section jd-excerpt">
        <h3>原始 JD 摘要</h3>
        <p>{job.description.slice(0, 900)}{job.description.length > 900 ? "…" : ""}</p>
      </section>

      <a className="apply-link" href={job.applyUrl} target="_blank" rel="noopener noreferrer">
        前往原站投递 <span aria-hidden="true">↗</span>
      </a>
    </>
  );

  if (dialog) {
    return (
      <div className="dialog-backdrop detail-backdrop" role="presentation" onMouseDown={onClose}>
        <article
          aria-labelledby={`detail-${job.id}`}
          aria-modal="true"
          className="job-detail job-detail--dialog"
          onMouseDown={(event) => event.stopPropagation()}
          ref={detailRef}
          role="dialog"
          tabIndex={-1}
        >
          {content}
        </article>
      </div>
    );
  }

  return <aside className="job-detail" ref={detailRef}>{content}</aside>;
}
