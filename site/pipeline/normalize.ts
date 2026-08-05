import { createHash } from "node:crypto";
import type { NormalizedJob } from "../src/domain/types";
import type { RawSourceJob } from "./adapters/types";

const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

const decodeEntities = (value: string): string =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&([a-z]+);/gi, (match, name: string) => namedEntities[name.toLowerCase()] ?? match);

export const cleanText = (value: string): string =>
  decodeEntities(
    value
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();

const classifyLanguage = (value: string): NormalizedJob["language"] => {
  const han = value.match(/\p{Script=Han}/gu)?.length ?? 0;
  const latin = value.match(/\p{Script=Latin}/gu)?.length ?? 0;
  const total = han + latin;
  if (total === 0) return "en";
  if (han > 0 && latin > 0 && Math.min(han, latin) / total >= 0.1) return "mixed";
  return han > latin ? "zh" : "en";
};

const inferWorkplaceType = (value: string): NormalizedJob["workplaceType"] => {
  const normalized = value.toLowerCase();
  if (/\bhybrid\b|混合/.test(normalized)) return "hybrid";
  if (/\bremote\b|远程/.test(normalized)) return "remote";
  if (/\bon[ -]?site\b|现场/.test(normalized)) return "onsite";
  return "unspecified";
};

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

export function normalizeRawJob(raw: RawSourceJob): NormalizedJob {
  const company = cleanText(raw.company);
  const title = cleanText(raw.title);
  const normalizedTitle = title.toLocaleLowerCase("en");
  const description = cleanText(raw.descriptionHtml);
  const locations = [...new Set(raw.locations.map(cleanText).filter(Boolean))];
  const safeLocations = locations.length > 0 ? locations : ["Unspecified"];
  const fingerprintInput = [
    company.toLocaleLowerCase("en"),
    normalizedTitle,
    safeLocations.map((location) => location.toLocaleLowerCase("en")).join("|"),
    description,
  ].join("\n");

  return {
    id: `${raw.source}:${raw.sourceJobId}`,
    source: raw.source,
    sourceJobId: raw.sourceJobId,
    sourceUrl: raw.sourceUrl,
    sourceUrls: [raw.sourceUrl],
    applyUrl: raw.applyUrl,
    company,
    title,
    normalizedTitle,
    roleFamily: "other",
    locations: safeLocations,
    workplaceType: inferWorkplaceType(`${title} ${safeLocations.join(" ")} ${description}`),
    language: classifyLanguage(`${title} ${description}`),
    description,
    responsibilities: [],
    requirements: [],
    preferredQualifications: [],
    skills: [],
    constraints: [],
    publishedAt: raw.publishedAt,
    updatedAt: raw.updatedAt,
    fetchedAt: raw.fetchedAt,
    status: "active",
    contentFingerprint: sha256(fingerprintInput),
  };
}
