import type { NormalizedJob, RoleFamily } from "./types";

export interface ClusterNode {
  id: RoleFamily;
  label: string;
  x: number;
  y: number;
  jobCount: number;
  delta7d: number;
  topSkills: Array<{ skillId: string; jobCount: number }>;
  topCompanies: Array<{ company: string; jobCount: number }>;
}

export interface ClusterEdge {
  source: RoleFamily;
  target: RoleFamily;
  jaccard: number;
  sharedSkills: string[];
}

export interface ClusterGraph {
  nodes: ClusterNode[];
  edges: ClusterEdge[];
}

const positions: Record<RoleFamily, { x: number; y: number }> = {
  "ai-product": { x: 18, y: 28 },
  "ai-solutions": { x: 48, y: 17 },
  "ai-engineering": { x: 80, y: 30 },
  "data-science": { x: 68, y: 75 },
  "people-analytics": { x: 28, y: 76 },
  other: { x: 50, y: 50 },
};

const labels: Record<RoleFamily, string> = {
  "ai-product": "AI 产品",
  "ai-solutions": "AI 解决方案",
  "ai-engineering": "AI 工程",
  "data-science": "数据科学",
  "people-analytics": "人才分析",
  other: "其他 AI",
};

const counts = (values: string[]): Array<{ value: string; count: number }> => {
  const result = new Map<string, number>();
  values.forEach((value) => result.set(value, (result.get(value) ?? 0) + 1));
  return [...result]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
};

const jaccard = (left: Set<string>, right: Set<string>): number => {
  const intersection = [...left].filter((skill) => right.has(skill)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
};

export function buildClusterGraph(
  jobs: NormalizedJob[],
  roleDeltas: Partial<Record<RoleFamily, number>> = {},
): ClusterGraph {
  const grouped = new Map<RoleFamily, NormalizedJob[]>();
  for (const job of jobs) {
    grouped.set(job.roleFamily, [...(grouped.get(job.roleFamily) ?? []), job]);
  }

  const nodes: ClusterNode[] = [...grouped]
    .map(([family, familyJobs]) => {
      const skillCounts = counts(familyJobs.flatMap((job) => [...new Set(job.skills)]));
      const companyCounts = counts(familyJobs.map((job) => job.company));
      return {
        id: family,
        label: labels[family],
        ...positions[family],
        jobCount: familyJobs.length,
        delta7d: roleDeltas[family] ?? 0,
        topSkills: skillCounts
          .slice(0, 5)
          .map((item) => ({ skillId: item.value, jobCount: item.count })),
        topCompanies: companyCounts
          .slice(0, 3)
          .map((item) => ({ company: item.value, jobCount: item.count })),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const edges: ClusterEdge[] = [];
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex];
      const right = nodes[rightIndex];
      const leftSkills = new Set(left.topSkills.map((item) => item.skillId));
      const rightSkills = new Set(right.topSkills.map((item) => item.skillId));
      const similarity = jaccard(leftSkills, rightSkills);
      if (similarity < 0.18) continue;
      edges.push({
        source: left.id,
        target: right.id,
        jaccard: Number(similarity.toFixed(4)),
        sharedSkills: [...leftSkills].filter((skill) => rightSkills.has(skill)).sort(),
      });
    }
  }

  return { nodes, edges };
}
