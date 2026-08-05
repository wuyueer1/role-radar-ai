export type SourceProvider = "greenhouse" | "lever" | "official-feed";
export type JobStatus = "active" | "suspect" | "removed";
export type RoleFamily =
  | "ai-product"
  | "ai-solutions"
  | "data-science"
  | "ai-engineering"
  | "people-analytics"
  | "other";
export type AnalysisMode = "e5" | "local" | "rules-fallback";

export interface NormalizedJob {
  id: string;
  source: SourceProvider;
  sourceJobId: string;
  sourceUrl: string;
  applyUrl: string;
  company: string;
  title: string;
  normalizedTitle: string;
  roleFamily: RoleFamily;
  locations: string[];
  workplaceType: "onsite" | "hybrid" | "remote" | "unspecified";
  language: "zh" | "en" | "mixed";
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
  skills: string[];
  constraints: string[];
  publishedAt: string | null;
  updatedAt: string | null;
  fetchedAt: string;
  status: JobStatus;
  contentFingerprint: string;
}

export interface CandidateEvidence {
  id: string;
  label: string;
  excerpt: string;
  strength: number;
  skillIds: string[];
}

export interface CandidateSkill {
  skillId: string;
  confidence: number;
  evidenceIds: string[];
}

export interface CandidateProfile {
  id: string;
  displayName: string;
  headline: string;
  summary: string;
  targetRoleFamilies: RoleFamily[];
  evidence: CandidateEvidence[];
  skills: CandidateSkill[];
  explicitConstraints: string[];
}

export interface ComponentScores {
  skill: number;
  evidence: number;
  semantic: number;
  adjacency: number;
  constraints: number;
}

export interface JobIntelligence {
  jobId: string;
  matchScore: number;
  analysisMode: AnalysisMode;
  componentScores: ComponentScores;
  matchedEvidence: { evidenceId: string; requirement: string; score: number }[];
  strengths: string[];
  gaps: string[];
  hardBlockers: string[];
  explanation: string;
  analyzedAt: string;
  modelRevision: string;
}

export interface SourceHealth {
  sourceId: string;
  company: string;
  status: "ok" | "partial" | "failed";
  fetchedAt: string;
  jobCount: number;
  message: string;
}

export interface MarketSnapshot {
  schemaVersion: 1;
  snapshotAt: string;
  dataRevision: string;
  sourceHealth: SourceHealth[];
  activeJobCount: number;
  newJobCount: number;
  removedJobCount: number;
  roleFamilyStats: { roleFamily: RoleFamily; jobCount: number; delta7d: number }[];
  skillStats: { skillId: string; jobCount: number; share: number; delta7d: number }[];
  jobs: Array<NormalizedJob & { intelligence: JobIntelligence }>;
}
