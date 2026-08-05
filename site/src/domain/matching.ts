import { classifyRoleFamily, extractSkills } from "./taxonomy";
import type {
  AnalysisMode,
  CandidateEvidence,
  CandidateProfile,
  JobIntelligence,
  NormalizedJob,
  RoleFamily,
} from "./types";

const adjacencyByRole: Record<RoleFamily, number> = {
  "ai-product": 92,
  "ai-solutions": 90,
  "data-science": 94,
  "ai-engineering": 66,
  "people-analytics": 96,
  other: 50,
};

const clampScore = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

const unique = <T,>(values: T[]): T[] => [...new Set(values)];

const requirementForSkill = (job: NormalizedJob, skillId: string): string => {
  const lines = [...job.requirements, ...job.preferredQualifications, ...job.responsibilities];
  return (
    lines.find((line) => extractSkills(line).includes(skillId)) ??
    `岗位技能要求：${skillId.replaceAll("-", " ")}`
  );
};

const strongestEvidence = (
  profile: CandidateProfile,
  skillId: string,
): CandidateEvidence | undefined =>
  profile.evidence
    .filter((evidence) => evidence.skillIds.includes(skillId))
    .sort((left, right) => right.strength - left.strength || left.id.localeCompare(right.id))[0];

interface Directive {
  kind: "require" | "exclude";
  value: string;
}

const parseDirective = (constraint: string): Directive | null => {
  const normalized = constraint.normalize("NFKC").trim().toLocaleLowerCase("en");
  const required = normalized.match(/^(?:require|requires|must|必须)[:：]?\s*(.+)$/);
  if (required) return { kind: "require", value: required[1] };
  const excluded = normalized.match(/^(?:exclude|cannot|can't|不能|不接受)[:：]?\s*(.+)$/);
  if (excluded) return { kind: "exclude", value: excluded[1] };
  return null;
};

const scoreConstraints = (
  job: NormalizedJob,
  profile: CandidateProfile,
): { score: number; hardBlockers: string[] } => {
  const candidateDirectives = profile.explicitConstraints.map(parseDirective).filter(Boolean) as Directive[];
  const jobDirectives = job.constraints.map(parseDirective).filter(Boolean) as Directive[];
  const hardBlockers: string[] = [];

  for (const candidate of candidateDirectives) {
    for (const requirement of jobDirectives) {
      if (candidate.value === requirement.value && candidate.kind !== requirement.kind) {
        hardBlockers.push(`明确约束冲突：${candidate.value}`);
      }
    }
  }

  if (profile.explicitConstraints.length === 0 || job.constraints.length === 0) {
    return { score: 50, hardBlockers: unique(hardBlockers) };
  }

  const profileSet = new Set(
    profile.explicitConstraints.map((value) => value.normalize("NFKC").toLocaleLowerCase("en")),
  );
  const overlap = job.constraints.filter((value) =>
    profileSet.has(value.normalize("NFKC").toLocaleLowerCase("en")),
  ).length;
  return {
    score: clampScore((overlap / job.constraints.length) * 100),
    hardBlockers: unique(hardBlockers),
  };
};

export interface MatchContext {
  semanticPercentile: number;
  mode: AnalysisMode;
  analyzedAt?: string;
  modelRevision?: string;
}

export function scoreJob(
  job: NormalizedJob,
  profile: CandidateProfile,
  context: MatchContext,
): JobIntelligence {
  const requiredSkills = unique(
    job.skills.length > 0
      ? job.skills
      : extractSkills(
          `${job.title}\n${job.description}\n${job.requirements.join("\n")}\n${job.responsibilities.join("\n")}`,
        ),
  );
  const confidenceBySkill = new Map(
    profile.skills.map((skill) => [skill.skillId, skill.confidence] as const),
  );
  const skillValues = requiredSkills.map((skillId) => (confidenceBySkill.get(skillId) ?? 0) * 100);
  const skill =
    skillValues.length > 0
      ? clampScore(skillValues.reduce((sum, value) => sum + value, 0) / skillValues.length)
      : 0;

  const evidenceValues = requiredSkills.map((skillId) =>
    strongestEvidence(profile, skillId),
  );
  const evidence =
    evidenceValues.length > 0
      ? clampScore(
          evidenceValues.reduce((sum, item) => sum + (item?.strength ?? 0) * 100, 0) /
            evidenceValues.length,
        )
      : 0;
  const matchedEvidence = requiredSkills.flatMap((skillId) => {
    const match = strongestEvidence(profile, skillId);
    if (!match) return [];
    return [
      {
        evidenceId: match.id,
        requirement: requirementForSkill(job, skillId),
        score: clampScore(match.strength * 100),
      },
    ];
  });
  const strengths = matchedEvidence.map((item) => {
    const evidenceItem = profile.evidence.find((evidenceRecord) => evidenceRecord.id === item.evidenceId);
    return `${item.requirement} ↔ ${evidenceItem?.label ?? item.evidenceId}`;
  });
  const gaps = requiredSkills
    .filter((skillId) => (confidenceBySkill.get(skillId) ?? 0) < 0.55)
    .map((skillId) => `待补证据：${skillId.replaceAll("-", " ")}`);
  const constraints = scoreConstraints(job, profile);
  const componentScores = {
    skill,
    evidence,
    semantic: clampScore(context.semanticPercentile),
    adjacency: adjacencyByRole[job.roleFamily],
    constraints: constraints.score,
  };
  const matchScore = clampScore(
    componentScores.skill * 0.35 +
      componentScores.evidence * 0.25 +
      componentScores.semantic * 0.2 +
      componentScores.adjacency * 0.1 +
      componentScores.constraints * 0.1,
  );
  const modeLabel =
    context.mode === "e5"
      ? "E5 岗位池百分位"
      : context.mode === "local"
        ? "浏览器本地文本相关度"
        : "确定性规则降级";

  return {
    jobId: job.id,
    matchScore,
    analysisMode: context.mode,
    componentScores,
    matchedEvidence,
    strengths,
    gaps,
    hardBlockers: constraints.hardBlockers,
    explanation: `总分由五个可复算分量组成；语义分使用${modeLabel}，不是录用或面试概率。`,
    analyzedAt: context.analyzedAt ?? new Date().toISOString(),
    modelRevision:
      context.modelRevision ??
      (context.mode === "local" ? "local-tfidf-char3-v1" : `${context.mode}-unversioned`),
  };
}

const stripNavigationNoise = (value: string): string => {
  const noise = /^(?:首页|登录|注册|下载\s*app|打开\s*app|职位列表|公司首页|home|sign in|log in)$/i;
  return value
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .normalize("NFKC")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !noise.test(line))
    .join("\n")
    .trim();
};

const featureCounts = (value: string): Map<string, number> => {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ");
  const features = new Map<string, number>();
  const add = (feature: string) => features.set(feature, (features.get(feature) ?? 0) + 1);
  normalized.match(/[a-z0-9+#.-]{2,}/g)?.forEach((word) => add(`w:${word}`));
  const compact = normalized.replace(/\s+/g, "");
  for (let index = 0; index <= compact.length - 3; index += 1) {
    add(`c:${compact.slice(index, index + 3)}`);
  }
  return features;
};

const tfidfCosine = (query: string, documents: string[]): number => {
  const all = [query, ...documents].map(featureCounts);
  const documentFrequency = new Map<string, number>();
  for (const vector of all) {
    for (const feature of vector.keys()) {
      documentFrequency.set(feature, (documentFrequency.get(feature) ?? 0) + 1);
    }
  }
  const weighted = all.map((vector) => {
    const result = new Map<string, number>();
    for (const [feature, count] of vector) {
      const idf = Math.log((all.length + 1) / ((documentFrequency.get(feature) ?? 0) + 1)) + 1;
      result.set(feature, count * idf);
    }
    return result;
  });
  const cosine = (left: Map<string, number>, right: Map<string, number>): number => {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (const value of left.values()) leftNorm += value * value;
    for (const value of right.values()) rightNorm += value * value;
    for (const [feature, value] of left) dot += value * (right.get(feature) ?? 0);
    return leftNorm === 0 || rightNorm === 0 ? 0 : dot / Math.sqrt(leftNorm * rightNorm);
  };
  return Math.max(0, ...weighted.slice(1).map((document) => cosine(weighted[0], document)));
};

const localFingerprint = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").repeat(8);
};

export type LocalJdResult =
  | { ok: true; titleGuess: string; analysis: JobIntelligence }
  | { ok: false; reason: "JD_TEXT_TOO_SHORT" | "JD_TEXT_UNREADABLE" };

export function analyzeLocalJd(value: string, profile: CandidateProfile): LocalJdResult {
  const text = stripNavigationNoise(value);
  const meaningfulCount = text.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  if (meaningfulCount < 120) return { ok: false, reason: "JD_TEXT_TOO_SHORT" };
  const replacementCount = text.match(/�/g)?.length ?? 0;
  if (replacementCount / text.length > 0.05) {
    return { ok: false, reason: "JD_TEXT_UNREADABLE" };
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const titleGuess = lines[0].replace(/^[-#*\s]+/, "").slice(0, 80) || "未命名职位";
  const skills = extractSkills(text);
  const roleFamily = classifyRoleFamily(titleGuess, skills);
  const now = new Date().toISOString();
  const job: NormalizedJob = {
    id: `local:${localFingerprint(text).slice(0, 16)}`,
    source: "official-feed",
    sourceJobId: "local-jd",
    sourceUrl: "https://local.invalid/jd",
    sourceUrls: ["https://local.invalid/jd"],
    applyUrl: "https://local.invalid/jd",
    company: "本地导入",
    title: titleGuess,
    normalizedTitle: titleGuess.toLocaleLowerCase("en"),
    roleFamily,
    locations: ["职位文本未结构化地点"],
    workplaceType: /remote|远程/i.test(text)
      ? "remote"
      : /hybrid|混合/i.test(text)
        ? "hybrid"
        : /on[ -]?site|现场/i.test(text)
          ? "onsite"
          : "unspecified",
    language: /\p{Script=Han}/u.test(text) && /\p{Script=Latin}/u.test(text) ? "mixed" : /\p{Script=Han}/u.test(text) ? "zh" : "en",
    description: text,
    responsibilities: lines.filter((line) => /^[-*•]/.test(line)),
    requirements: lines.filter((line) => /要求|require|must|熟悉|具备/i.test(line)),
    preferredQualifications: lines.filter((line) => /优先|preferred|plus/i.test(line)),
    skills,
    constraints: lines.filter((line) => /必须|must|required|地点|location|onsite|现场/i.test(line)),
    publishedAt: null,
    updatedAt: null,
    fetchedAt: now,
    status: "active",
    contentFingerprint: localFingerprint(text),
  };
  const relevance = tfidfCosine(
    text,
    profile.evidence.map((evidence) => `${evidence.label} ${evidence.excerpt}`),
  );
  return {
    ok: true,
    titleGuess,
    analysis: scoreJob(job, profile, {
      semanticPercentile: relevance * 100,
      mode: "local",
      analyzedAt: now,
      modelRevision: "local-tfidf-char3-v1",
    }),
  };
}
