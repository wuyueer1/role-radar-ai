import { useEffect, useMemo, useState } from "react";
import { normalizeLocation } from "../domain/taxonomy";
import type { MarketSnapshot, RoleFamily, SourceProvider } from "../domain/types";

export type ExplorerJob = MarketSnapshot["jobs"][number];
export type LocationScope = "default" | "global" | "all";
export type ExplorerFamily = RoleFamily | "all";
export type ExplorerSource = SourceProvider | "all";
export type ExplorerSort = "match" | "updated" | "growth";

const locations = new Set<LocationScope>(["default", "global", "all"]);
const families = new Set<ExplorerFamily>([
  "all",
  "ai-product",
  "ai-solutions",
  "data-science",
  "ai-engineering",
  "people-analytics",
  "other",
]);
const sources = new Set<ExplorerSource>(["all", "greenhouse", "lever", "official-feed"]);
const sorts = new Set<ExplorerSort>(["match", "updated", "growth"]);

const validParam = <T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: Set<T>,
  fallback: T,
): T => {
  const value = params.get(key) as T | null;
  return value && allowed.has(value) ? value : fallback;
};

const initialParams = (): URLSearchParams =>
  new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

const updatedTime = (job: ExplorerJob): number =>
  Date.parse(job.updatedAt ?? job.publishedAt ?? job.fetchedAt);

interface ExplorerOptions {
  roleGrowth?: Partial<Record<RoleFamily, number>>;
}

export function useJobExplorer(jobs: ExplorerJob[], options: ExplorerOptions = {}) {
  const [query, setQuery] = useState(() => initialParams().get("q")?.trim() ?? "");
  const [location, setLocation] = useState<LocationScope>(() =>
    validParam(initialParams(), "location", locations, "default"),
  );
  const [family, setFamily] = useState<ExplorerFamily>(() =>
    validParam(initialParams(), "family", families, "all"),
  );
  const [source, setSource] = useState<ExplorerSource>(() =>
    validParam(initialParams(), "source", sources, "all"),
  );
  const [sort, setSort] = useState<ExplorerSort>(() =>
    validParam(initialParams(), "sort", sorts, "match"),
  );
  const [requestedJobId, setRequestedJobId] = useState(() => initialParams().get("job") ?? "");

  const visibleJobs = useMemo(() => {
    const needle = query.normalize("NFKC").toLocaleLowerCase("en");
    const filtered = jobs.filter((job) => {
      if (
        needle &&
        !`${job.title} ${job.company}`
          .normalize("NFKC")
          .toLocaleLowerCase("en")
          .includes(needle)
      ) {
        return false;
      }
      if (family !== "all" && job.roleFamily !== family) return false;
      if (source !== "all" && job.source !== source) return false;
      if (
        location !== "all" &&
        !job.locations.some((value) => normalizeLocation(value).marketScope === location)
      ) {
        return false;
      }
      return true;
    });
    return [...filtered].sort((left, right) => {
      if (sort === "updated") {
        return updatedTime(right) - updatedTime(left) || left.id.localeCompare(right.id);
      }
      if (sort === "growth") {
        return (
          (options.roleGrowth?.[right.roleFamily] ?? 0) -
            (options.roleGrowth?.[left.roleFamily] ?? 0) ||
          right.intelligence.matchScore - left.intelligence.matchScore ||
          left.id.localeCompare(right.id)
        );
      }
      return (
        right.intelligence.matchScore - left.intelligence.matchScore ||
        left.id.localeCompare(right.id)
      );
    });
  }, [family, jobs, location, options.roleGrowth, query, sort, source]);

  const visibleIds = visibleJobs.map((job) => job.id).join("\n");
  const selectedJob =
    visibleJobs.find((job) => job.id === requestedJobId) ?? visibleJobs[0] ?? null;
  const selectedId = selectedJob?.id ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location !== "default") params.set("location", location);
    if (family !== "all") params.set("family", family);
    if (source !== "all") params.set("source", source);
    if (sort !== "match") params.set("sort", sort);
    if (selectedId && visibleJobs.some((job) => job.id === selectedId)) {
      params.set("job", selectedId);
    }
    const search = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
    );
  }, [family, location, query, selectedId, sort, source, visibleIds, visibleJobs]);

  return {
    query,
    location,
    family,
    source,
    sort,
    visibleJobs,
    selectedJob,
    setQuery: (value: string) => {
      setQuery(value);
      setRequestedJobId("");
    },
    setLocation: (value: LocationScope) => {
      setLocation(value);
      setRequestedJobId("");
    },
    setFamily: (value: ExplorerFamily) => {
      setFamily(value);
      setRequestedJobId("");
    },
    setSource: (value: ExplorerSource) => {
      setSource(value);
      setRequestedJobId("");
    },
    setSort: (value: ExplorerSort) => {
      setSort(value);
      setRequestedJobId("");
    },
    selectJob: (jobId: string) => setRequestedJobId(jobId),
  };
}
