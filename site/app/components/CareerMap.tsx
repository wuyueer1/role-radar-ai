import type {
  Role,
  RouteDefinition,
  TransitionEdge,
} from "../lib/career-data.ts";

interface CareerMapProps {
  roles: Role[];
  transitions: TransitionEdge[];
  routes: RouteDefinition[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string | null) => void;
}

export function CareerMap({
  roles,
  transitions,
  routes,
  selectedRoleId,
  onSelectRole,
}: CareerMapProps) {
  const relatedRoles = selectedRoleId
    ? new Set(
        routes
          .filter((route) => route.roleIds.includes(selectedRoleId))
          .flatMap((route) => route.roleIds),
      )
    : new Set(roles.map((role) => role.id));
  const roleMap = new Map(roles.map((role) => [role.id, role]));
  const selectedRole = selectedRoleId
    ? roleMap.get(selectedRoleId)
    : undefined;

  return (
    <section
      className="panel graph-panel"
      aria-label="职业跃迁图谱"
      data-tour-target="graph"
    >
      <div className="panel-heading">
        <div>
          <p className="section-index">02 / MAP</p>
          <h2>职业跃迁图谱</h2>
        </div>
        <p className="data-note">策展图谱 · 非实时市场规模</p>
      </div>

      <div className="map-columns" aria-hidden="true">
        <span>当前</span>
        <span>桥接</span>
        <span>目标</span>
      </div>

      <div className="career-map">
        <svg
          className="map-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label="从当前角色经过桥接角色到目标 AI 角色的路径连线"
        >
          {transitions.map((edge) => {
            const source = roleMap.get(edge.sourceRoleId);
            const target = roleMap.get(edge.targetRoleId);
            if (!source || !target) return null;
            const active =
              relatedRoles.has(source.id) && relatedRoles.has(target.id);
            return (
              <line
                key={`${source.id}-${target.id}`}
                x1={source.position.x}
                y1={source.position.y}
                x2={target.position.x}
                y2={target.position.y}
                className={active ? "is-active" : "is-muted"}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {roles.map((role) => {
          const active = relatedRoles.has(role.id);
          return (
            <button
              key={role.id}
              className={`map-node stage-${role.stage}${
                active ? " is-active" : " is-muted"
              }${selectedRoleId === role.id ? " is-selected" : ""}`}
              style={{ left: `${role.position.x}%`, top: `${role.position.y}%` }}
              type="button"
              aria-pressed={selectedRoleId === role.id}
              onClick={() =>
                onSelectRole(selectedRoleId === role.id ? null : role.id)
              }
            >
              <span className="node-dot" aria-hidden="true" />
              <span className="node-label">{role.title}</span>
            </button>
          );
        })}
      </div>

      <div className="map-legend">
        <span className="legend-current">当前能力资产</span>
        <span className="legend-bridge">桥接岗位</span>
        <span className="legend-target">目标 AI 岗位</span>
      </div>

      {selectedRole && (
        <div className="focus-status" role="status">
          <span>已聚焦</span>
          <strong>{selectedRole.title}</strong>
          <p>{selectedRole.description}</p>
          <small>再次点击或按 Esc 恢复全图。</small>
        </div>
      )}
    </section>
  );
}

