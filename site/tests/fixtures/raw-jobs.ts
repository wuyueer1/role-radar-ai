import type { RawSourceJob } from "../../pipeline/adapters/types";

export const rawGreenhouseJob: RawSourceJob = {
  source: "greenhouse",
  sourceRegistryId: "anthropic-greenhouse",
  sourceJobId: "fixture-duplicate-gh",
  company: "Anthropic",
  title: "AI Product Manager",
  locations: [" Hong Kong "],
  descriptionHtml:
    "<style>.hidden{display:none}</style><p>Lead AI product discovery &amp; evaluation.</p><script>alert('x')</script>",
  sourceUrl: "https://job-boards.greenhouse.io/anthropic/jobs/fixture-duplicate-gh",
  applyUrl: "https://job-boards.greenhouse.io/anthropic/jobs/fixture-duplicate-gh",
  publishedAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
  fetchedAt: "2026-08-05T00:00:00.000Z",
};

export const rawLeverDuplicate: RawSourceJob = {
  source: "lever",
  sourceRegistryId: "anthropic-lever-fixture",
  sourceJobId: "fixture-duplicate-lv",
  company: "Anthropic",
  title: "AI Product Manager",
  locations: ["Hong Kong"],
  descriptionHtml:
    "<p>Lead AI product discovery &amp; evaluation.</p><p>Partner with research, engineering, and customers to define measurable outcomes.</p>",
  sourceUrl: "https://jobs.lever.co/anthropic/fixture-duplicate-lv",
  applyUrl: "https://jobs.lever.co/anthropic/fixture-duplicate-lv/apply",
  publishedAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-04T00:00:00.000Z",
  fetchedAt: "2026-08-05T00:00:00.000Z",
};
