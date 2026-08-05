import type { JobSourceAdapter, RawSourceJob, SourceRegistryEntry } from "./types";
import {
  isRecord,
  requireHttpsUrl,
  requireString,
  SourceContractError,
} from "./types";

const stringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const listHtml = (value: unknown): string => {
  if (!Array.isArray(value)) return "";
  return value
    .filter(isRecord)
    .map((item) => {
      const heading = typeof item.text === "string" ? `<h3>${item.text}</h3>` : "";
      const content = typeof item.content === "string" ? item.content : "";
      return `${heading}${content}`;
    })
    .join("\n");
};

export function mapLeverJobs(
  input: unknown,
  company: string,
  sourceRegistryId: string,
  fetchedAt: string,
): RawSourceJob[] {
  if (!Array.isArray(input)) {
    throw new SourceContractError("Lever response must be an array");
  }

  return input.map((value, index) => {
    if (!isRecord(value)) {
      throw new SourceContractError(`Lever job ${index} must be an object`);
    }
    const categories = isRecord(value.categories) ? value.categories : {};
    const allLocations = stringArray(categories.allLocations);
    const fallbackLocation =
      typeof categories.location === "string" && categories.location.trim()
        ? [categories.location.trim()]
        : ["Unspecified"];
    const description = typeof value.descriptionPlain === "string" ? value.descriptionPlain : "";
    const createdAt = typeof value.createdAt === "number" ? new Date(value.createdAt).toISOString() : null;

    return {
      source: "lever",
      sourceRegistryId,
      sourceJobId: requireString(value.id, `jobs[${index}].id`),
      company,
      title: requireString(value.text, `jobs[${index}].text`),
      locations: allLocations.length > 0 ? allLocations : fallbackLocation,
      descriptionHtml: `${description}\n${listHtml(value.lists)}`.trim(),
      sourceUrl: requireHttpsUrl(value.hostedUrl, `jobs[${index}].hostedUrl`),
      applyUrl: requireHttpsUrl(value.applyUrl, `jobs[${index}].applyUrl`),
      publishedAt: createdAt,
      updatedAt: null,
      fetchedAt,
    } satisfies RawSourceJob;
  });
}

export async function fetchLeverJobs(
  entry: SourceRegistryEntry,
  fetcher: typeof fetch = fetch,
): Promise<RawSourceJob[]> {
  const siteName = requireString(entry.siteName, "siteName");
  const response = await fetcher(
    `https://api.lever.co/v0/postings/${encodeURIComponent(siteName)}?mode=json`,
  );
  if (!response.ok) {
    throw new SourceContractError(`Lever returned HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  return mapLeverJobs(body, entry.company, entry.id, new Date().toISOString());
}

export const leverAdapter: JobSourceAdapter = { fetch: fetchLeverJobs };
