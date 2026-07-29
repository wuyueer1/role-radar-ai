import type {
  CandidateProfile,
  ScoreKey,
  Skill,
  Weights,
} from "../lib/career-data.ts";

const SCORE_LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能迁移",
  adjacency: "职业邻近",
  evidence: "证据强度",
  aiLeverage: "AI 杠杆",
  speed: "转型速度",
};

interface ProfilePanelProps {
  profile: CandidateProfile;
  skills: Skill[];
  weights: Weights;
  horizonMonths: number;
  onWeightChange: (key: ScoreKey, value: number) => void;
  onPreset: (preset: "fastest" | "technical" | "business") => void;
  onReset: () => void;
  onHorizonChange: (months: number) => void;
}

export function ProfilePanel({
  profile,
  skills,
  weights,
  horizonMonths,
  onWeightChange,
  onPreset,
  onReset,
  onHorizonChange,
}: ProfilePanelProps) {
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
  const visibleSkills = [...profile.skills]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 7);

  return (
    <section
      className="panel profile-panel"
      aria-label="候选人画像与偏好"
      data-tour-target="profile"
    >
      <div className="panel-heading">
        <div>
          <p className="section-index">01 / PROFILE</p>
          <h2>{profile.name}</h2>
        </div>
        <span className="evidence-count">
          {profile.evidence.length} 条证据
        </span>
      </div>
      <p className="profile-headline">{profile.headline}</p>
      <p className="profile-summary">{profile.summary}</p>

      <div className="skill-cloud" aria-label="核心能力">
        {visibleSkills.map((candidateSkill) => (
          <span key={candidateSkill.skillId}>
            {skillMap.get(candidateSkill.skillId)?.shortName ??
              candidateSkill.skillId}
            <strong>{Math.round(candidateSkill.confidence * 100)}</strong>
          </span>
        ))}
      </div>

      <div className="control-block">
        <div className="control-heading">
          <h3>转型时间</h3>
          <span>{horizonMonths} 个月窗口</span>
        </div>
        <div className="segmented-control">
          {[3, 6, 12].map((months) => (
            <button
              key={months}
              type="button"
              aria-pressed={horizonMonths === months}
              onClick={() => onHorizonChange(months)}
            >
              {months} 个月
            </button>
          ))}
        </div>
      </div>

      <div className="control-block">
        <div className="control-heading">
          <h3>决策权重</h3>
          <span>总权重 100%</span>
        </div>
        {(Object.entries(weights) as [ScoreKey, number][]).map(
          ([key, value]) => (
            <label className="weight-control" key={key}>
              <span>{SCORE_LABELS[key]}</span>
              <span className="weight-value">{Math.round(value * 100)}%</span>
              <input
                type="range"
                min="5"
                max="60"
                step="1"
                value={Math.round(value * 100)}
                aria-label={`${SCORE_LABELS[key]}权重`}
                onChange={(event) =>
                  onWeightChange(key, Number(event.target.value) / 100)
                }
              />
            </label>
          ),
        )}
      </div>

      <div className="preset-grid" aria-label="情景预设">
        <button type="button" onClick={() => onPreset("fastest")}>
          最快进入 AI
        </button>
        <button type="button" onClick={() => onPreset("technical")}>
          最大化技术深度
        </button>
        <button type="button" onClick={() => onPreset("business")}>
          发挥商业优势
        </button>
        <button className="reset-button" type="button" onClick={onReset}>
          恢复推荐权重 ↺
        </button>
      </div>
    </section>
  );
}
