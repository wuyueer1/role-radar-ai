import { z } from "zod";
import type { CandidateProfile, MarketSnapshot } from "./types";

const nonEmpty = z.string().trim().min(1);
const dateTime = z.string().datetime({ offset: true });
const nullableDateTime = dateTime.nullable();
const score = z.number().min(0).max(100);
const confidence = z.number().min(0).max(1);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const httpsUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:", "URL must use HTTPS");

export const roleFamilySchema = z.enum([
  "ai-product",
  "ai-solutions",
  "data-science",
  "ai-engineering",
  "people-analytics",
  "other",
]);

const candidateEvidenceSchema = z
  .object({
    id: nonEmpty,
    label: nonEmpty,
    excerpt: nonEmpty,
    strength: confidence,
    skillIds: z.array(nonEmpty),
  })
  .strict();

const candidateSkillSchema = z
  .object({
    skillId: nonEmpty,
    confidence,
    evidenceIds: z.array(nonEmpty),
  })
  .strict();

export const candidateProfileSchema = z
  .object({
    id: nonEmpty,
    displayName: nonEmpty,
    headline: nonEmpty,
    summary: nonEmpty,
    targetRoleFamilies: z.array(roleFamilySchema).min(1),
    evidence: z.array(candidateEvidenceSchema).min(1),
    skills: z.array(candidateSkillSchema).min(1),
    explicitConstraints: z.array(nonEmpty),
  })
  .strict();

const componentScoresSchema = z
  .object({
    skill: score,
    evidence: score,
    semantic: score,
    adjacency: score,
    constraints: score,
  })
  .strict();

const jobIntelligenceSchema = z
  .object({
    jobId: nonEmpty,
    matchScore: score,
    analysisMode: z.enum(["e5", "local", "rules-fallback"]),
    componentScores: componentScoresSchema,
    matchedEvidence: z.array(
      z
        .object({
          evidenceId: nonEmpty,
          requirement: nonEmpty,
          score,
        })
        .strict(),
    ),
    strengths: z.array(nonEmpty),
    gaps: z.array(nonEmpty),
    hardBlockers: z.array(nonEmpty),
    explanation: nonEmpty,
    analyzedAt: dateTime,
    modelRevision: nonEmpty,
  })
  .strict();

export const normalizedJobSchema = z
  .object({
    id: nonEmpty,
    source: z.enum(["greenhouse", "lever", "official-feed"]),
    sourceJobId: nonEmpty,
    sourceUrl: httpsUrl,
    applyUrl: httpsUrl,
    company: nonEmpty,
    title: nonEmpty,
    normalizedTitle: nonEmpty,
    roleFamily: roleFamilySchema,
    locations: z.array(nonEmpty).min(1),
    workplaceType: z.enum(["onsite", "hybrid", "remote", "unspecified"]),
    language: z.enum(["zh", "en", "mixed"]),
    description: nonEmpty,
    responsibilities: z.array(nonEmpty),
    requirements: z.array(nonEmpty),
    preferredQualifications: z.array(nonEmpty),
    skills: z.array(nonEmpty),
    constraints: z.array(nonEmpty),
    publishedAt: nullableDateTime,
    updatedAt: nullableDateTime,
    fetchedAt: dateTime,
    status: z.enum(["active", "suspect", "removed"]),
    contentFingerprint: sha256,
  })
  .strict();

const sourceHealthSchema = z
  .object({
    sourceId: nonEmpty,
    company: nonEmpty,
    status: z.enum(["ok", "partial", "failed"]),
    fetchedAt: dateTime,
    jobCount: z.number().int().nonnegative(),
    message: nonEmpty,
  })
  .strict();

export const marketSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    snapshotAt: dateTime,
    dataRevision: sha256,
    sourceHealth: z.array(sourceHealthSchema).min(1),
    activeJobCount: z.number().int().nonnegative(),
    newJobCount: z.number().int().nonnegative(),
    removedJobCount: z.number().int().nonnegative(),
    roleFamilyStats: z.array(
      z
        .object({
          roleFamily: roleFamilySchema,
          jobCount: z.number().int().nonnegative(),
          delta7d: z.number(),
        })
        .strict(),
    ),
    skillStats: z.array(
      z
        .object({
          skillId: nonEmpty,
          jobCount: z.number().int().nonnegative(),
          share: z.number().min(0).max(1),
          delta7d: z.number(),
        })
        .strict(),
    ),
    jobs: z.array(normalizedJobSchema.extend({ intelligence: jobIntelligenceSchema })),
  })
  .strict();

export const parseCandidateProfile = (input: unknown): CandidateProfile =>
  candidateProfileSchema.parse(input);

export const parseMarketSnapshot = (input: unknown): MarketSnapshot =>
  marketSnapshotSchema.parse(input);
