import { useEffect, useMemo, useRef, useState } from "react";
import { buildClusterGraph } from "../domain/clusters";
import type { NormalizedJob, RoleFamily } from "../domain/types";

interface ClusterMapProps {
  jobs: NormalizedJob[];
  roleDeltas: Partial<Record<RoleFamily, number>>;
  selectedFamily: RoleFamily | "all";
  onSelect: (family: RoleFamily, label: string) => void;
}

const nodeRadius = (jobCount: number): number =>
  Math.min(10.5, 5.5 + Math.sqrt(jobCount) * 1.1);

const deltaLabel = (value: number): string =>
  value === 0 ? "7 日持平" : `7 日${value > 0 ? "增加" : "减少"} ${Math.abs(value)} 个`;

export function ClusterMap({ jobs, roleDeltas, selectedFamily, onSelect }: ClusterMapProps) {
  const graph = useMemo(() => buildClusterGraph(jobs, roleDeltas), [jobs, roleDeltas]);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node] as const));
  const canvasRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 8.5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspectRatio(width / height);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="cluster-section" aria-labelledby="cluster-title">
      <div className="cluster-copy">
        <div>
          <p className="eyebrow">ROLE CLUSTERS / SHARED SKILLS</p>
          <h2 id="cluster-title">看见岗位之间真正相连的能力</h2>
        </div>
        <p>
          节点越大，已接入岗位越多；颜色表示 7 日变化；连线来自岗位簇 Top skills 的 Jaccard
          相似度。
        </p>
      </div>
      <div className="cluster-canvas" ref={canvasRef}>
        <svg
          aria-labelledby="cluster-graphic-title cluster-graphic-description"
          className="cluster-svg"
          role="img"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <title id="cluster-graphic-title">AI 岗位簇技能关系图</title>
          <desc id="cluster-graphic-description">
            圆的大小表示岗位数量，颜色表示七日岗位变化，连线表示两个岗位簇共享技能。
          </desc>
          {graph.edges.map((edge) => {
            const source = nodes.get(edge.source);
            const target = nodes.get(edge.target);
            if (!source || !target) return null;
            return (
              <line
                className="cluster-edge"
                key={`${edge.source}:${edge.target}`}
                strokeWidth={0.35 + edge.jaccard * 1.5}
                x1={source.x}
                x2={target.x}
                y1={source.y}
                y2={target.y}
              >
                <title>
                  {source.label}与{target.label}共享 {edge.sharedSkills.join("、")}；Jaccard
                  相似度 {edge.jaccard.toFixed(2)}
                </title>
              </line>
            );
          })}
          {graph.nodes.map((node) => (
            <ellipse
              className={`cluster-node-shape cluster-node-shape--${node.delta7d > 0 ? "up" : node.delta7d < 0 ? "down" : "flat"}`}
              cx={node.x}
              cy={node.y}
              key={node.id}
              rx={nodeRadius(node.jobCount) / aspectRatio}
              ry={nodeRadius(node.jobCount)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="cluster-node-layer" aria-label="岗位簇筛选">
          {graph.nodes.map((node) => (
            <button
              aria-label={`${node.label}岗位簇，${node.jobCount} 个岗位，${deltaLabel(node.delta7d)}`}
              aria-pressed={selectedFamily === node.id}
              className="cluster-node-button"
              key={node.id}
              onClick={() => onSelect(node.id, node.label)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              type="button"
            >
              <strong>{node.label}</strong>
              <span>{node.jobCount}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="cluster-legend" aria-label="聚类图例">
        <span><i className="legend-dot legend-dot--up" />增长</span>
        <span><i className="legend-dot legend-dot--flat" />持平</span>
        <span><i className="legend-dot legend-dot--down" />下降</span>
        <p>基于已接入真实岗位，不代表全市场</p>
      </div>
    </section>
  );
}
