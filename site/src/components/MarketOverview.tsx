import type { MarketSnapshot, RoleFamily } from "../domain/types";

interface MarketOverviewProps {
  snapshot: MarketSnapshot;
}

const roleLabels: Record<RoleFamily, string> = {
  "ai-product": "AI 产品",
  "ai-solutions": "AI 解决方案",
  "data-science": "数据科学",
  "ai-engineering": "AI 工程",
  "people-analytics": "人才分析",
  other: "其他 AI",
};

export function MarketOverview({ snapshot }: MarketOverviewProps) {
  const largestRole = [...snapshot.roleFamilyStats].sort(
    (left, right) => right.jobCount - left.jobCount,
  )[0];
  const fastestSkill = [...snapshot.skillStats].sort(
    (left, right) => right.delta7d - left.delta7d || right.jobCount - left.jobCount,
  )[0];

  return (
    <section className="market-overview" aria-labelledby="market-overview-title">
      <div className="section-heading">
        <p className="eyebrow">MARKET PULSE / CONNECTED SOURCES ONLY</p>
        <h2 id="market-overview-title">此刻，AI 岗位市场在说什么</h2>
      </div>
      <div className="metric-grid">
        <article className="metric-card metric-card--blue" data-testid="active-metric">
          <p>当前岗位</p>
          <strong>{snapshot.activeJobCount}</strong>
          <span>来自 {snapshot.sourceHealth.length} 个已审查来源</span>
        </article>
        <article className="metric-card">
          <p>岗位流动</p>
          <strong>
            +{snapshot.newJobCount}
            <small> / −{snapshot.removedJobCount}</small>
          </strong>
          <span>新增 / 移除，基于最近成功快照</span>
        </article>
        <article className="metric-card">
          <p>最大角色簇</p>
          <strong className="metric-word">
            {largestRole ? roleLabels[largestRole.roleFamily] : "暂无"}
          </strong>
          <span>{largestRole?.jobCount ?? 0} 个岗位</span>
        </article>
        <article className="metric-card metric-card--acid">
          <p>增长最快技能</p>
          <strong className="metric-word">
            {fastestSkill?.skillId.replaceAll("-", " ") ?? "样本积累中"}
          </strong>
          <span>
            {fastestSkill?.jobCount ?? 0} / {snapshot.activeJobCount} 个岗位 · 7 日份额
            {fastestSkill ? `${fastestSkill.delta7d >= 0 ? "+" : ""}${Math.round(fastestSkill.delta7d * 100)}%` : "—"}
          </span>
        </article>
      </div>
    </section>
  );
}
