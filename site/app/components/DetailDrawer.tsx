import { useEffect, useState } from "react";

import {
  buildNinetyDayPlan,
} from "../lib/career-engine.ts";
import type {
  CandidateProfile,
  ScoreKey,
  ScoredRoute,
  Skill,
  Weights,
} from "../lib/career-data.ts";

type DrawerTab = "evidence" | "score" | "plan" | "model";

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "evidence", label: "证据" },
  { id: "score", label: "评分" },
  { id: "plan", label: "行动计划" },
  { id: "model", label: "模型说明" },
];

const SCORE_LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能迁移度",
  adjacency: "职业邻近度",
  evidence: "证据强度",
  aiLeverage: "AI 杠杆价值",
  speed: "转型速度",
};

interface DetailDrawerProps {
  route: ScoredRoute;
  profile: CandidateProfile;
  skills: Skill[];
  weights: Weights;
  onClose: () => void;
}

export function DetailDrawer({
  route,
  profile,
  skills,
  weights,
  onClose,
}: DetailDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("evidence");
  const evidence = profile.evidence.filter((item) =>
    route.evidenceIds.includes(item.id),
  );
  const plan = buildNinetyDayPlan(route, skills);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        data-tour-target="drawer"
      >
        <header>
          <div>
            <p className="section-index">DECISION TRACE</p>
            <h2 id="drawer-title">{route.label} · 路径决策依据</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="关闭路径决策依据"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="drawer-tabs" role="tablist" aria-label="决策依据分类">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "evidence" && (
          <div className="drawer-content">
            <p className="drawer-lead">
              推荐不是从岗位关键词开始，而是从可核验经历开始。
            </p>
            {evidence.map((item) => (
              <article className="evidence-card" key={item.id}>
                <span>
                  来源：简历证据 · 强度 {Math.round(item.strength * 100)}
                </span>
                <h3>{item.label}</h3>
                <p>{item.excerpt}</p>
              </article>
            ))}
          </div>
        )}

        {tab === "score" && (
          <div className="drawer-content">
            <p className="formula">
              总分 = Σ（组件分 × 当前权重）=
              <strong>{route.overallScore}</strong>
            </p>
            {(Object.entries(route.componentScores) as [
              ScoreKey,
              number,
            ][]).map(([key, value]) => (
              <div className="formula-row" key={key}>
                <span>{SCORE_LABELS[key]}</span>
                <span>
                  {Math.round(value)} × {Math.round(weights[key] * 100)}%
                </span>
              </div>
            ))}
            <p className="notice">
              这是策展图谱上的决策辅助分，不是录用概率或因果效应。
            </p>
          </div>
        )}

        {tab === "plan" && (
          <div className="drawer-content plan-grid">
            {plan.map((phase) => (
              <article key={phase.range}>
                <span>{phase.range}</span>
                <h3>{phase.label}</h3>
                {phase.actions.map((action) => (
                  <div key={action.title}>
                    <strong>{action.title}</strong>
                    <p>{action.deliverable}</p>
                    <small>证据目标：{action.evidenceGoal}</small>
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}

        {tab === "model" && (
          <div className="drawer-content model-boundary">
            <article>
              <span>01</span>
              <div>
                <h3>本地图谱</h3>
                <p>定义角色、技能和可解释转移边。</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>确定性评分</h3>
                <p>相同输入与权重始终产生相同结果。</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>可选 Live AI</h3>
                <p>只做结构化和表达；AI 不能修改底层分数。</p>
              </div>
            </article>
          </div>
        )}
      </aside>
    </div>
  );
}

