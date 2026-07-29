import type {
  CandidateProfile,
  ComponentScores,
  DemoDataset,
  Role,
  RouteDefinition,
  ScoreKey,
  ScoredRoute,
  Skill,
  Weights,
} from "./career-data.ts";

const SCORE_KEYS: ScoreKey[] = [
  "skillTransfer",
  "adjacency",
  "evidence",
  "aiLeverage",
  "speed",
];
const MIN_LIVE_AI_SKILL_CONFIDENCE = 0.5;

export const DEFAULT_WEIGHTS: Weights = {
  skillTransfer: 0.3,
  adjacency: 0.2,
  evidence: 0.2,
  aiLeverage: 0.2,
  speed: 0.1,
};

export const PRESET_WEIGHTS = {
  fastest: {
    skillTransfer: 0.27,
    adjacency: 0.18,
    evidence: 0.15,
    aiLeverage: 0.1,
    speed: 0.3,
  },
  technical: {
    skillTransfer: 0.28,
    adjacency: 0.1,
    evidence: 0.12,
    aiLeverage: 0.4,
    speed: 0.1,
  },
  business: {
    skillTransfer: 0.16,
    adjacency: 0.3,
    evidence: 0.32,
    aiLeverage: 0.08,
    speed: 0.14,
  },
} satisfies Record<string, Weights>;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function normalizeWeights(weights: Weights): Weights {
  const positive = SCORE_KEYS.map((key) => Math.max(0, weights[key]));
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total === 0) return { ...DEFAULT_WEIGHTS };
  return Object.fromEntries(
    SCORE_KEYS.map((key, index) => [key, positive[index] / total]),
  ) as Weights;
}

export function rebalanceWeights(
  current: Weights,
  changedKey: ScoreKey,
  nextValue: number,
): Weights {
  const selected = Math.max(0, Math.min(1, nextValue));
  const otherKeys = SCORE_KEYS.filter((key) => key !== changedKey);
  const otherTotal = otherKeys.reduce((sum, key) => sum + current[key], 0);
  const remainder = 1 - selected;
  const result = { ...current, [changedKey]: selected };
  for (const key of otherKeys) {
    result[key] =
      otherTotal === 0
        ? remainder / otherKeys.length
        : (current[key] / otherTotal) * remainder;
  }
  return result;
}

function findRole(data: DemoDataset, roleId: string): Role {
  const role = data.roles.find((item) => item.id === roleId);
  if (!role) throw new Error(`Unknown role: ${roleId}`);
  return role;
}

function findEdge(data: DemoDataset, sourceRoleId: string, targetRoleId: string) {
  return data.transitions.find(
    (edge) =>
      edge.sourceRoleId === sourceRoleId &&
      edge.targetRoleId === targetRoleId,
  );
}

export function validateDataset(data: DemoDataset): string[] {
  const errors: string[] = [];
  const roleIds = new Set(data.roles.map((role) => role.id));
  const skillIds = new Set(data.skills.map((skill) => skill.id));
  const evidenceIds = new Set(data.profile.evidence.map((item) => item.id));

  for (const role of data.roles) {
    for (const requirement of role.requiredSkills) {
      if (!skillIds.has(requirement.skillId)) {
        errors.push(`role ${role.id} references unknown skill ${requirement.skillId}`);
      }
    }
  }

  for (const edge of data.transitions) {
    if (!roleIds.has(edge.sourceRoleId) || !roleIds.has(edge.targetRoleId)) {
      errors.push(
        `transition ${edge.sourceRoleId} → ${edge.targetRoleId} references an unknown role`,
      );
    }
    for (const skillId of edge.bridgeSkillIds) {
      if (!skillIds.has(skillId)) {
        errors.push(`transition references unknown skill ${skillId}`);
      }
    }
  }

  for (const candidateSkill of data.profile.skills) {
    if (!skillIds.has(candidateSkill.skillId)) {
      errors.push(`profile references unknown skill ${candidateSkill.skillId}`);
    }
    for (const evidenceId of candidateSkill.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        errors.push(`profile references unknown evidence ${evidenceId}`);
      }
    }
  }

  for (const route of data.routes) {
    for (const roleId of route.roleIds) {
      if (!roleIds.has(roleId)) {
        errors.push(`route ${route.id} references unknown role ${roleId}`);
      }
    }
    for (let index = 0; index < route.roleIds.length - 1; index += 1) {
      if (!findEdge(data, route.roleIds[index], route.roleIds[index + 1])) {
        errors.push(`route ${route.id} has no edge at step ${index + 1}`);
      }
    }
  }

  return errors;
}

function candidateSkill(profile: CandidateProfile, skillId: string) {
  return profile.skills.find((skill) => skill.skillId === skillId);
}

function skillCoverage(profile: CandidateProfile, role: Role): number {
  const total = role.requiredSkills.reduce((sum, item) => sum + item.weight, 0);
  const covered = role.requiredSkills.reduce(
    (sum, item) =>
      sum +
      item.weight *
        (candidateSkill(profile, item.skillId)?.confidence ?? 0),
    0,
  );
  return clamp((covered / total) * 100);
}

function evidenceCoverage(profile: CandidateProfile, role: Role): number {
  const evidenceMap = new Map(
    profile.evidence.map((item) => [item.id, item.strength]),
  );
  const total = role.requiredSkills.reduce((sum, item) => sum + item.weight, 0);
  const covered = role.requiredSkills.reduce((sum, item) => {
    const skill = candidateSkill(profile, item.skillId);
    const strengths =
      skill?.evidenceIds.map((id) => evidenceMap.get(id) ?? 0) ?? [];
    const strongest = strengths.length > 0 ? Math.max(...strengths) : 0;
    return sum + item.weight * strongest;
  }, 0);
  return clamp((covered / total) * 100);
}

function adjacencyScore(
  data: DemoDataset,
  route: RouteDefinition,
): number {
  const values = route.roleIds.slice(0, -1).map((sourceRoleId, index) => {
    const edge = findEdge(data, sourceRoleId, route.roleIds[index + 1]);
    if (!edge) throw new Error(`Missing route edge for ${route.id}`);
    return edge.adjacency / 100;
  });
  const geometricMean = Math.pow(
    values.reduce((product, value) => product * value, 1),
    1 / values.length,
  );
  const lengthPenalty = Math.max(
    0.85,
    1 - Math.max(0, values.length - 1) * 0.04,
  );
  return clamp(geometricMean * lengthPenalty * 100);
}

function aiLeverageScore(profile: CandidateProfile, role: Role): number {
  const aiSkills = profile.skills.filter((skill) =>
    [
      "machine-learning",
      "nlp-embeddings",
      "graph-analytics",
      "responsible-ai",
    ].includes(skill.skillId),
  );
  const readiness =
    aiSkills.reduce((sum, skill) => sum + skill.confidence, 0) /
    aiSkills.length;
  return clamp(role.aiLeverage * (0.72 + readiness * 0.28));
}

function speedScore(
  profile: CandidateProfile,
  role: Role,
  route: RouteDefinition,
  horizonMonths: number,
): number {
  const missingGapCount = role.requiredSkills.filter(
    (requirement) =>
      (candidateSkill(profile, requirement.skillId)?.confidence ?? 0) < 0.65,
  ).length;
  const expectedPreparationMonths =
    (route.estimatedMonths + role.typicalPrepMonths) / 2;
  const latePenalty =
    Math.max(0, expectedPreparationMonths - horizonMonths) * 8;
  const durationPenalty =
    Math.max(0, expectedPreparationMonths - 3) * 2;
  const gapPenalty = missingGapCount * 4;
  return clamp(100 - latePenalty - durationPenalty - gapPenalty);
}

function componentScores(
  data: DemoDataset,
  route: RouteDefinition,
  horizonMonths: number,
): ComponentScores {
  const targetRole = findRole(data, route.roleIds.at(-1)!);
  return {
    skillTransfer: skillCoverage(data.profile, targetRole),
    adjacency: adjacencyScore(data, route),
    evidence: evidenceCoverage(data.profile, targetRole),
    aiLeverage: aiLeverageScore(data.profile, targetRole),
    speed: speedScore(data.profile, targetRole, route, horizonMonths),
  };
}

export function rankRoutes(
  data: DemoDataset,
  rawWeights: Weights,
  horizonMonths: number,
): ScoredRoute[] {
  const weights = normalizeWeights(rawWeights);
  return data.routes
    .map((route) => {
      const scores = componentScores(data, route, horizonMonths);
      const overallScore = Math.round(
        SCORE_KEYS.reduce(
          (sum, key) => sum + scores[key] * weights[key],
          0,
        ),
      );
      return {
        ...route,
        targetRole: findRole(data, route.roleIds.at(-1)!),
        componentScores: scores,
        overallScore,
        strengths: [],
        gaps: [],
        evidenceIds: [],
        changeReason: "当前为推荐权重。",
      };
    })
    .sort(
      (a, b) =>
        b.overallScore - a.overallScore ||
        a.label.localeCompare(b.label, "zh-CN"),
    );
}

export function enrichRoutes(
  data: DemoDataset,
  routes: ScoredRoute[],
): ScoredRoute[] {
  const skillMap = new Map(
    data.skills.map((skill) => [skill.id, skill.name]),
  );
  const profileSkills = new Map(
    data.profile.skills.map((skill) => [skill.skillId, skill]),
  );
  return routes.map((route) => {
    const requirements = [...route.targetRole.requiredSkills].sort(
      (a, b) => b.weight - a.weight,
    );
    const strengths = requirements
      .filter(
        (requirement) =>
          (profileSkills.get(requirement.skillId)?.confidence ?? 0) >= 0.72,
      )
      .slice(0, 3)
      .map(
        (requirement) =>
          skillMap.get(requirement.skillId) ?? requirement.skillId,
      );
    const gaps = requirements
      .filter(
        (requirement) =>
          (profileSkills.get(requirement.skillId)?.confidence ?? 0) < 0.65,
      )
      .slice(0, 2)
      .map(
        (requirement) =>
          skillMap.get(requirement.skillId) ?? requirement.skillId,
      );
    const evidenceIds = Array.from(
      new Set(
        requirements.flatMap(
          (requirement) =>
            profileSkills.get(requirement.skillId)?.evidenceIds ?? [],
        ),
      ),
    );
    return {
      ...route,
      strengths,
      gaps:
        gaps.length > 0 ? gaps : ["目标岗位情境化作品证据"],
      evidenceIds,
    };
  });
}

export function explainScenario(
  route: ScoredRoute,
  previousRoute: ScoredRoute | undefined,
  scenarioLabel: string,
  weights: Weights,
  previousWeights: Weights = DEFAULT_WEIGHTS,
  currentRank?: number,
  previousRank?: number,
): string {
  if (!previousRoute || scenarioLabel === "推荐权重") {
    return "当前为推荐权重。";
  }
  const scoreLabels: Record<ScoreKey, string> = {
    skillTransfer: "技能迁移",
    adjacency: "职业邻近",
    evidence: "证据强度",
    aiLeverage: "AI 杠杆",
    speed: "转型速度",
  };
  const dominantKey = SCORE_KEYS.reduce((best, key) => {
    const contributionChange =
      route.componentScores[key] * weights[key] -
      previousRoute.componentScores[key] * previousWeights[key];
    const bestChange =
      route.componentScores[best] * weights[best] -
      previousRoute.componentScores[best] * previousWeights[best];
    return Math.abs(contributionChange) > Math.abs(bestChange) ? key : best;
  });
  const weightDelta = weights[dominantKey] - previousWeights[dominantKey];
  const driver =
    Math.abs(weightDelta) >= 0.005
      ? `${scoreLabels[dominantKey]}权重 ${weightDelta > 0 ? "+" : "−"}${Math.abs(
          Math.round(weightDelta * 100),
        )} 个百分点`
      : `${scoreLabels[dominantKey]}组件贡献发生变化`;
  const rank =
    currentRank && previousRank
      ? currentRank === previousRank
        ? `排名保持第 ${currentRank}`
        : `第 ${previousRank} → 第 ${currentRank}`
      : "排名已重新计算";
  const delta = route.overallScore - previousRoute.overallScore;
  const scoreChange =
    delta === 0
      ? "总分保持不变"
      : `总分${delta > 0 ? "增加" : "减少"} ${Math.abs(delta)} 分`;
  return `${scenarioLabel}：${rank}；${driver}，${scoreChange}。`;
}

export interface PlanAction {
  title: string;
  deliverable: string;
  evidenceGoal: string;
}

export interface PlanPhase {
  range: "0–30 天" | "31–60 天" | "61–90 天";
  label: string;
  actions: PlanAction[];
}

export function buildNinetyDayPlan(
  route: RouteDefinition,
  skills: Skill[],
): PlanPhase[] {
  const skillMap = new Map(skills.map((skill) => [skill.id, skill.name]));
  const seeds =
    route.actionSeeds.length > 0
      ? route.actionSeeds
      : [
          {
            gapSkillId: "experiment-design",
            deliverable: "完成一个目标岗位情境化案例",
            evidenceGoal: "形成可在面试中展示的决策与复盘记录",
          },
        ];
  const at = (index: number) => seeds[index % seeds.length];
  return [
    {
      range: "0–30 天",
      label: "验证问题",
      actions: [
        {
          title: `补齐 ${skillMap.get(at(0).gapSkillId) ?? at(0).gapSkillId}`,
          deliverable: at(0).deliverable,
          evidenceGoal: at(0).evidenceGoal,
        },
      ],
    },
    {
      range: "31–60 天",
      label: "做出证据",
      actions: [
        {
          title: "把方法变成可操作原型",
          deliverable: `围绕「${route.label}」完成可交互版本并记录取舍`,
          evidenceGoal: "获得 3 位目标用户的任务完成反馈",
        },
      ],
    },
    {
      range: "61–90 天",
      label: "形成信号",
      actions: [
        {
          title: "打磨面试叙事",
          deliverable: "完成三分钟演示、技术架构图和失败复盘",
          evidenceGoal: "能够分别回答产品、数据和工程三类追问",
        },
      ],
    },
  ];
}

export interface LiveAiProfile {
  headline: string;
  summary: string;
  skills: {
    name: string;
    confidence: number;
    evidence: string;
  }[];
}

export interface LiveAiAdapter {
  analyze(text: string): Promise<unknown>;
}

export function validateLiveAiProfile(
  value: unknown,
):
  | { ok: true; value: LiveAiProfile }
  | { ok: false; reason: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, reason: "响应不是对象" };
  }
  const item = value as Record<string, unknown>;
  if (
    typeof item.headline !== "string" ||
    item.headline.trim().length < 2
  ) {
    return { ok: false, reason: "缺少有效 headline" };
  }
  if (
    typeof item.summary !== "string" ||
    item.summary.trim().length < 8 ||
    !Array.isArray(item.skills) ||
    item.skills.length === 0
  ) {
    return { ok: false, reason: "缺少 summary 或 skills" };
  }
  const validSkills = item.skills.every((skill) => {
    if (!skill || typeof skill !== "object") return false;
    const entry = skill as Record<string, unknown>;
    return (
      typeof entry.name === "string" &&
      entry.name.trim().length > 0 &&
      typeof entry.confidence === "number" &&
      Number.isFinite(entry.confidence) &&
      entry.confidence >= MIN_LIVE_AI_SKILL_CONFIDENCE &&
      entry.confidence <= 1 &&
      typeof entry.evidence === "string" &&
      entry.evidence.trim().length > 0
    );
  });
  return validSkills
    ? { ok: true, value: item as unknown as LiveAiProfile }
    : { ok: false, reason: "skills 结构不合法或置信度不足" };
}

export async function analyzeProfileWithFallback(
  originalText: string,
  adapter: LiveAiAdapter,
) {
  try {
    const raw = await adapter.analyze(originalText);
    const parsed = validateLiveAiProfile(raw);
    if (!parsed.ok) throw new Error(parsed.reason);
    return {
      mode: "live" as const,
      profile: parsed.value,
      originalText,
      notice: "Live AI 已完成结构化；分数仍由本地引擎计算。",
    };
  } catch {
    return {
      mode: "stable" as const,
      originalText,
      notice: "Live AI 不可用，已回退到稳定演示模式。",
    };
  }
}
