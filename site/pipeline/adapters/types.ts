export interface SourceRegistryEntry {
  id: string;
  provider: "greenhouse" | "lever";
  company: string;
  boardToken?: string;
  siteName?: string;
  enabled: boolean;
  termsUrl: string;
  reviewedAt: string;
}

export interface RawSourceJob {
  source: "greenhouse" | "lever";
  sourceRegistryId: string;
  sourceJobId: string;
  company: string;
  title: string;
  locations: string[];
  descriptionHtml: string;
  sourceUrl: string;
  applyUrl: string;
  publishedAt: string | null;
  updatedAt: string | null;
  fetchedAt: string;
}

export interface JobSourceAdapter {
  fetch(entry: SourceRegistryEntry, fetcher?: typeof fetch): Promise<RawSourceJob[]>;
}

export class SourceContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceContractError";
  }
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SourceContractError(`Missing or invalid ${field}`);
  }
  return value.trim();
};

export const requireHttpsUrl = (value: unknown, field: string): string => {
  const url = requireString(value, field);
  try {
    if (new URL(url).protocol !== "https:") {
      throw new SourceContractError(`${field} must use HTTPS`);
    }
  } catch (error) {
    if (error instanceof SourceContractError) throw error;
    throw new SourceContractError(`Missing or invalid ${field}`);
  }
  return url;
};
