import type { JobSourceAdapter, RawSourceJob, SourceRegistryEntry } from "./types";
import {
  isRecord,
  requireHttpsUrl,
  requireString,
  SourceContractError,
} from "./types";

const nullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

export function mapGreenhouseJobs(
  input: unknown,
  company: string,
  sourceRegistryId: string,
  fetchedAt: string,
): RawSourceJob[] {
  if (!isRecord(input) || !Array.isArray(input.jobs)) {
    throw new SourceContractError("Greenhouse response must contain jobs[]");
  }

  return input.jobs.map((value, index) => {
    if (!isRecord(value)) {
      throw new SourceContractError(`Greenhouse job ${index} must be an object`);
    }
    const location = isRecord(value.location) ? value.location.name : undefined;
    const sourceUrl = requireHttpsUrl(value.absolute_url, `jobs[${index}].absolute_url`);
    const sourceJobId =
      typeof value.id === "number" || typeof value.id === "string"
        ? String(value.id)
        : requireString(undefined, `jobs[${index}].id`);

    return {
      source: "greenhouse",
      sourceRegistryId,
      sourceJobId,
      company,
      title: requireString(value.title, `jobs[${index}].title`),
      locations: [typeof location === "string" && location.trim() ? location.trim() : "Unspecified"],
      descriptionHtml: typeof value.content === "string" ? value.content : "",
      sourceUrl,
      applyUrl: sourceUrl,
      publishedAt: nullableString(value.first_published),
      updatedAt: nullableString(value.updated_at),
      fetchedAt,
    } satisfies RawSourceJob;
  });
}

export async function fetchGreenhouseJobs(
  entry: SourceRegistryEntry,
  fetcher: typeof fetch = fetch,
): Promise<RawSourceJob[]> {
  const token = requireString(entry.boardToken, "boardToken");
  const response = await fetcher(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`,
  );
  if (!response.ok) {
    throw new SourceContractError(`Greenhouse returned HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  return mapGreenhouseJobs(body, entry.company, entry.id, new Date().toISOString());
}

export const greenhouseAdapter: JobSourceAdapter = { fetch: fetchGreenhouseJobs };
