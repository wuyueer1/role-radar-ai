import type {
  CandidateProfile,
  Role,
  ScoreKey,
  ScoredRoute,
  Skill,
} from "../lib/career-data.ts";

const SCORE_LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能",
  adjacency: "邻近",
  evidence: "证据",
  aiLeverage: "AI 杠杆",
  speed: "速度",
};

interface RoutePanelProps {
  routes: ScoredRoute[];
  selectedRouteId: string;
  selectedRoleId: string | null;
  selectedRole?: Role;
  profile: CandidateProfile;
  skills: Skill[];
  onSelectRoute: (routeId: string) => void;
  onOpenDetails: (routeId: string) => void;
}

export function RoutePanel({
  routes,
  selectedRouteId,
  selectedRoleId,
  selectedRole,
  profile,
  skills,
  onSelectRoute,
  onOpenDetails,
}: RoutePanelProps) {
  const selected =
    routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const skillMap = new Map(skills.map((skill) => [skill.id, skill.name]));
  const profileSkillMap = new Map(
    profile.skills.map((skill) => [skill.skillId, skill]),
  );
  const selectedRequirements = selectedRole
    ? [...selectedRole.requiredSkills].sort((a, b) => b.weight - a.weight)
    : [];
  const selectedRoleEvidenceIds = Array.from(
    new Set(
      selectedRequirements.flatMap(
        (requirement) =>
          profileSkillMap.get(requirement.skillId)?.evidenceIds ?? [],
      ),
    ),
  );
  const selectedRoleEvidence = profile.evidence.filter((item) =>
    selectedRoleEvidenceIds.includes(item.id),
  );
  const selectedRoleGaps = selectedRequirements.filter(
    (requirement) =>
      (profileSkillMap.get(requirement.skillId)?.confidence ?? 0) < 0.65,
  );
  const selectedRoleIsCurated = selectedRole
    ? routes.some((route) => route.roleIds.includes(selectedRole.id))
    : false;

  return (
    <section
      className="panel route-panel"
      aria-label="路径比较"
      data-tour-target="routes"
    >
      <div className="panel-heading">
        <div>
          <p className="section-index">03 / ROUTES</p>
          <h2>路径比较</h2>
        </div>
        <p className="data-note">分数 ≠ 录用概率</p>
      </div>

      <div className="route-list">
        {routes.map((route, index) => {
          const isSelected = route.id === selected.id;
          const isRelated =
            !selectedRoleId || route.roleIds.includes(selectedRoleId);
          return (
            <article
              className={`route-card${isSelected ? " is-selected" : ""}${
                isRelated ? "" : " is-muted"
              }`}
              data-testid="route-card"
              data-route-id={route.id}
              key={route.id}
            >
              <button
                className="route-card-button"
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectRoute(route.id)}
              >
                <span className="route-rank">0{index + 1}</span>
                <span className="route-title">
                  <strong>{route.label}</strong>
                  <small>{route.estimatedMonths} 个月准备周期</small>
                </span>
                <span className="route-score">{route.overallScore}</span>
              </button>

              <div className="score-grid">
                {(Object.entries(route.componentScores) as [
                  ScoreKey,
                  number,
                ][]).map(([key, value]) => (
                  <div data-testid="component-score" key={key}>
                    <span>{SCORE_LABELS[key]}</span>
                    <strong>{Math.round(value)}</strong>
                  </div>
                ))}
              </div>

              <p className="change-reason">{route.changeReason}</p>
              <button
                className="details-button"
                data-testid={`details-${route.id}`}
                type="button"
                onClick={() => onOpenDetails(route.id)}
              >
                查看完整依据 <span aria-hidden="true">↗</span>
              </button>
            </article>
          );
        })}
      </div>

      {selectedRole ? (
        <section className="role-exploration" aria-labelledby="role-exploration-title">
          <p className="section-index">ROLE EXPLORATION</p>
          <h3 id="role-exploration-title">探索角色：{selectedRole.title}</h3>
          {!selectedRoleIsCurated && (
            <p className="exploration-note">
              该角色不属于当前三条策展主路径，因此不强行生成伪精确路径分数。
            </p>
          )}
          <div>
            <span>关键技能</span>
            <ul aria-label="关键技能">
              {selectedRequirements.slice(0, 6).map((requirement) => (
                <li key={requirement.skillId}>
                  {skillMap.get(requirement.skillId) ?? requirement.skillId}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span>已有证据 · {selectedRoleEvidence.length}</span>
            <ul aria-label="已有证据">
              {selectedRoleEvidence.length > 0 ? (
                selectedRoleEvidence.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))
              ) : (
                <li>暂无直接简历证据</li>
              )}
            </ul>
          </div>
          <div>
            <span>待补技能 · {selectedRoleGaps.length}</span>
            <ul aria-label="待补技能">
              {selectedRoleGaps.length > 0 ? (
                selectedRoleGaps.map((requirement) => (
                  <li key={requirement.skillId}>
                    {skillMap.get(requirement.skillId) ?? requirement.skillId}
                  </li>
                ))
              ) : (
                <li>暂无明显技能缺口</li>
              )}
            </ul>
          </div>
        </section>
      ) : (
        <div className="route-summary">
          <div>
            <span>可迁移优势</span>
            <ul>
              {selected.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <span>关键缺口</span>
            <ul>
              {selected.gaps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
