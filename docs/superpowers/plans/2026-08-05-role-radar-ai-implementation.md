# RoleRadar AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the owner-only static CareerGraph demo with a public, polished RoleRadar AI site that refreshes real jobs, explains Yueer's fit, analyzes pasted JDs locally, and deploys without an OpenAI login.

**Architecture:** Migrate `site/` to a static React + TypeScript + Vite app. A scheduled TypeScript pipeline fetches reviewed Greenhouse and Lever boards, normalizes and deduplicates jobs, invokes a pinned local multilingual E5 Python process with deterministic fallback, then publishes schema-validated JSON consumed by the browser; GitHub Actions persists the last good snapshot and deploys GitHub Pages.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest 3, Testing Library, Playwright, Zod, Node 22, Python 3.12, sentence-transformers 5.6.0, `intfloat/multilingual-e5-small`, GitHub Actions, GitHub Pages.

---

## Scope and file map

The data pipeline, analysis engine, frontend, and deployment remain one plan because each consumes the previous unit's typed artifact. Each task still ends with independently testable software and a focused commit.

### Runtime and configuration

- Modify `site/package.json`: replace Vinext/Cloudflare commands and dependencies with static Vite, Zod, and `tsx` commands.
- Modify `site/package-lock.json`: regenerate only through `npm install`.
- Modify `site/tsconfig.json`: include `src/`, `pipeline/`, and `tests/`; remove Next plugin and generated type paths.
- Modify `site/vite.config.ts`: use `@vitejs/plugin-react`, relative base paths, and deterministic build output.
- Modify `site/vitest.config.ts`: separate browser-like component tests from Node pipeline tests.
- Modify `site/playwright.config.ts`: run Vite preview at three required viewports.
- Create `site/index.html`, `site/src/main.tsx`, and `site/src/RoleRadarApp.tsx`.
- Delete `site/app/`, `site/worker/`, `site/build/`, `site/next.config.ts`, `site/.openai/hosting.json`, and obsolete Vinext render tests only after replacement tests pass.

### Domain and data

- Create `site/src/domain/types.ts`: shared job, profile, score, snapshot, health, cluster, and trend types.
- Create `site/src/domain/schemas.ts`: Zod schemas and public parsing functions.
- Create `site/src/domain/taxonomy.ts`: bilingual skill aliases, role-family rules, and location normalization.
- Create `site/src/domain/matching.ts`: explainable five-component scoring and local JD analysis.
- Create `site/src/domain/clusters.ts`: role-family nodes and skill-overlap edges.
- Create `site/src/domain/trends.ts`: 7/30-day snapshot comparisons.
- Create `site/data/candidate-profile.json`: reviewed anonymized profile migrated from the existing dataset.
- Create `site/data/source-registry.json`: reviewed Greenhouse/Lever source registry.
- Create `site/public/data/current.json`, `history.json`, and `source-health.json`: versioned last-good seed artifacts.

### Pipeline

- Create `site/pipeline/adapters/types.ts`, `greenhouse.ts`, and `lever.ts`.
- Create `site/pipeline/probe-sources.ts`: status, JSON-shape, and minimum-content checks before a registry entry can be enabled.
- Create `site/pipeline/normalize.ts` and `dedupe.ts`.
- Create `site/pipeline/embeddings/e5.py`, `e5-provider.ts`, and `requirements-e5.txt`.
- Create `site/pipeline/build-snapshot.ts` and `run.ts`.
- Create `site/pipeline/fixtures/greenhouse.json` and `lever.json`.

### UI

- Create `site/src/components/AppHeader.tsx`, `MarketOverview.tsx`, `JobFilters.tsx`, `JobList.tsx`, `JobDetail.tsx`, `ClusterMap.tsx`, `JdAnalyzer.tsx`, `SourceHealthDialog.tsx`, and `useDialogFocus.ts`.
- Create `site/src/data/loadSnapshot.ts` and `site/src/state/useJobExplorer.ts`.
- Create `site/src/styles/tokens.css`, `base.css`, `layout.css`, and `components.css`.
- Modify `site/public/sw.js`, `favicon.svg`, and `og.png` for RoleRadar and data-aware offline caching.

### Tests, automation, and handoff

- Create focused tests under `site/tests/domain/`, `site/tests/pipeline/`, and `site/tests/components/`.
- Replace `site/e2e/interview-flow.spec.ts` with RoleRadar flows and add `site/e2e/public-access.spec.ts`.
- Create `.github/workflows/role-radar-pages.yml` at repository root.
- Modify `site/README.md` and create `docs/role-radar-demo-script.md` and `docs/role-radar-validation.md`.

### Task 1: Replace Vinext/Sites with a testable static Vite shell

**Files:**
- Create: `site/index.html`
- Create: `site/src/main.tsx`
- Create: `site/src/RoleRadarApp.tsx`
- Create: `site/src/styles/tokens.css`
- Create: `site/src/styles/base.css`
- Create: `site/tests/components/app-shell.test.tsx`
- Modify: `site/package.json`
- Modify: `site/package-lock.json`
- Modify: `site/tsconfig.json`
- Modify: `site/vite.config.ts`
- Modify: `site/vitest.config.ts`
- Modify: `site/eslint.config.mjs`
- Delete: `site/postcss.config.mjs`

- [x] **Step 1: Write the failing Vite shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";

describe("RoleRadarApp shell", () => {
  it("introduces the public job-intelligence product", () => {
    render(<RoleRadarApp />);
    expect(screen.getByRole("heading", { name: "RoleRadar AI" })).toBeVisible();
    expect(screen.getByText("把招聘市场变成可解释的个人机会")).toBeVisible();
    expect(screen.getByRole("button", { name: "分析一条 JD" })).toBeEnabled();
  });
});
```

- [x] **Step 2: Run the test and verify the missing module failure**

Run: `cd site && npx vitest run tests/components/app-shell.test.tsx`

Expected: FAIL because `../../src/RoleRadarApp` does not exist.

- [x] **Step 3: Install the static runtime and replace the build configuration**

Run:

```bash
cd site
npm uninstall next vinext react-server-dom-webpack @cloudflare/vite-plugin @vitejs/plugin-rsc tailwindcss @tailwindcss/postcss wrangler eslint-config-next
npm install zod
npm install --save-dev @vitejs/plugin-react tsx @eslint/js@9.39.4 globals typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh
```

Set the scripts in `site/package.json` exactly to:

```json
{
  "dev": "vite",
  "build": "npm run typecheck && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit --incremental false",
  "lint": "eslint . --ignore-pattern dist",
  "test": "vitest run",
  "test:domain": "vitest run tests/domain",
  "test:pipeline": "vitest run tests/pipeline",
  "test:components": "vitest run tests/components",
  "test:e2e": "playwright test",
  "test:all": "npm run lint && npm run typecheck && npm test && npm run build",
  "data:probe": "tsx pipeline/probe-sources.ts",
  "data:update": "tsx pipeline/run.ts"
}
```

Set `site/vite.config.ts` to:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: { outDir: "dist", sourcemap: true },
  server: process.env.CODEX_SANDBOX === "seatbelt"
    ? { watch: { useFsEvents: false, usePolling: true } }
    : undefined,
});
```

Set `site/tsconfig.json` to a strict bundler configuration with `target: "ES2022"`, `jsx: "react-jsx"`, `resolveJsonModule: true`, `allowImportingTsExtensions: true`, `types: ["vite/client", "node"]`, `include: ["src", "pipeline", "tests", "vite.config.ts", "vitest.config.ts"]`, and `exclude: ["dist", "node_modules", "app", "worker", "build"]`.

- [x] **Step 4: Add the minimal shell**

```tsx
// site/src/RoleRadarApp.tsx
export function RoleRadarApp() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className="app-header">
        <div>
          <p className="eyebrow">AI JOB INTELLIGENCE / PUBLIC PORTFOLIO</p>
          <h1>RoleRadar <span>AI</span></h1>
          <p>把招聘市场变成可解释的个人机会</p>
        </div>
        <button type="button">分析一条 JD</button>
      </header>
      <main id="main-content" aria-busy="true">
        <p>正在读取最近成功的岗位快照…</p>
      </main>
    </div>
  );
}
```

```tsx
// site/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RoleRadarApp } from "./RoleRadarApp";
import "./styles/tokens.css";
import "./styles/base.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><RoleRadarApp /></StrictMode>,
);
```

Create `site/index.html` with `lang="zh-CN"`, title `RoleRadar AI | AI 岗位情报与匹配工作台`, description, Open Graph/Twitter metadata pointing to `./og.png`, a theme color of `#F7F5EF`, and `<div id="root"></div><script type="module" src="/src/main.tsx"></script>`.

- [x] **Step 5: Add exact base tokens and pass the shell gate**

```css
/* site/src/styles/tokens.css */
:root {
  --paper: #f7f5ef;
  --ink: #111821;
  --blue: #2d5bff;
  --acid: #b6f36b;
  --coral: #ff6b5f;
  --fog: #e7e9e5;
  --muted: #5e6670;
  --line: color-mix(in srgb, var(--ink) 18%, transparent);
  --shadow: 0 24px 70px rgb(17 24 33 / 10%);
  --sans: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
```

Run: `cd site && npm run test:components -- app-shell.test.tsx && npm run lint && npm run build`

Expected: component test and lint PASS, and Vite writes `dist/index.html`.

- [x] **Step 6: Commit the static shell**

```bash
git add site/index.html site/src site/tests/components/app-shell.test.tsx site/package.json site/package-lock.json site/tsconfig.json site/vite.config.ts site/vitest.config.ts
git commit -m "refactor: establish public RoleRadar Vite shell"
```

### Task 2: Define and validate the public data contracts

**Files:**
- Create: `site/src/domain/types.ts`
- Create: `site/src/domain/schemas.ts`
- Create: `site/data/candidate-profile.json`
- Create: `site/tests/domain/schemas.test.ts`
- Create: `site/tests/fixtures/market-snapshot.ts`
- Modify: `site/tsconfig.json`

- [x] **Step 1: Write failing schema and privacy tests**

```ts
import { describe, expect, it } from "vitest";
import profile from "../../data/candidate-profile.json";
import { parseCandidateProfile, parseMarketSnapshot } from "../../src/domain/schemas";
import { validSnapshot } from "../fixtures/market-snapshot";

describe("public data contracts", () => {
  it("accepts a complete market snapshot", () => {
    expect(parseMarketSnapshot(validSnapshot).jobs).toHaveLength(2);
  });

  it("rejects jobs without an original application URL", () => {
    const broken = structuredClone(validSnapshot);
    delete (broken.jobs[0] as { applyUrl?: string }).applyUrl;
    expect(() => parseMarketSnapshot(broken)).toThrow(/applyUrl/);
  });

  it("keeps the public profile anonymous", () => {
    const parsed = parseCandidateProfile(profile);
    expect(parsed.displayName).toBe("Yueer W.");
    expect(JSON.stringify(parsed)).not.toMatch(/@|\+?\d{8,}/);
  });
});
```

- [x] **Step 2: Run and verify the missing contract failure**

Run: `cd site && npm run test:domain -- schemas.test.ts`

Expected: FAIL because `src/domain/schemas.ts` is missing.

- [x] **Step 3: Create exact shared types**

```ts
export type SourceProvider = "greenhouse" | "lever" | "official-feed";
export type JobStatus = "active" | "suspect" | "removed";
export type RoleFamily = "ai-product" | "ai-solutions" | "data-science" | "ai-engineering" | "people-analytics" | "other";
export type AnalysisMode = "e5" | "local" | "rules-fallback";

export interface NormalizedJob {
  id: string;
  source: SourceProvider;
  sourceJobId: string;
  sourceUrl: string;
  sourceUrls: string[];
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

export interface CandidateEvidence { id: string; label: string; excerpt: string; strength: number; skillIds: string[]; }
export interface CandidateSkill { skillId: string; confidence: number; evidenceIds: string[]; }
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

export interface ComponentScores { skill: number; evidence: number; semantic: number; adjacency: number; constraints: number; }
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

export interface SourceHealth { sourceId: string; company: string; status: "ok" | "partial" | "failed"; fetchedAt: string; jobCount: number; message: string; }
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
```

- [x] **Step 4: Implement Zod schemas and parse functions**

Define schemas matching every field above, use `z.string().url()` for source/application URLs, `z.string().datetime()` for non-null timestamps, `z.string().regex(/^[a-f0-9]{64}$/)` for `dataRevision`, `z.number().min(0).max(100)` for component scores, and export:

```ts
export const parseCandidateProfile = (input: unknown): CandidateProfile => candidateProfileSchema.parse(input);
export const parseMarketSnapshot = (input: unknown): MarketSnapshot => marketSnapshotSchema.parse(input);
```

Create the two-job `validSnapshot` fixture with one Greenhouse and one Lever job, distinct IDs, valid HTTPS URLs, all five component scores, a fixed `snapshotAt: "2026-08-05T00:00:00.000Z"`, and a fixed 64-character lowercase hexadecimal `dataRevision`.

- [x] **Step 5: Migrate the anonymized profile exactly**

Create `site/data/candidate-profile.json` with `id: "profile-yueer-w"`, `displayName: "Yueer W."`, the existing headline and summary, target families `ai-product`, `ai-solutions`, `data-science`, and `ai-engineering`, the eight existing evidence records `ev-career-network` through `ev-ai-boundary`, the existing sixteen skill-confidence records (normalize legacy `ux-research` to canonical `user-research`), and `explicitConstraints: []`. Do not include `experienceSignals`, email, phone, address, university IDs, or file paths.

- [x] **Step 6: Run the contract gate and commit**

Run: `cd site && npm run test:domain -- schemas.test.ts && npm run typecheck`

Expected: 3 tests PASS and TypeScript exits 0.

```bash
git add site/src/domain site/data/candidate-profile.json site/tests/domain site/tests/fixtures site/tsconfig.json
git commit -m "feat: define RoleRadar public data contracts"
```

### Task 3: Implement reviewed Greenhouse and Lever adapters

**Files:**
- Create: `site/data/source-registry.json`
- Create: `site/pipeline/adapters/types.ts`
- Create: `site/pipeline/adapters/greenhouse.ts`
- Create: `site/pipeline/adapters/lever.ts`
- Create: `site/pipeline/probe-sources.ts`
- Create: `site/pipeline/fixtures/greenhouse.json`
- Create: `site/pipeline/fixtures/lever.json`
- Create: `site/tests/pipeline/adapters.test.ts`
- Create: `site/tests/pipeline/probe-sources.test.ts`

- [x] **Step 1: Write failing adapter contract tests**

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import greenhouseFixture from "../../pipeline/fixtures/greenhouse.json";
import leverFixture from "../../pipeline/fixtures/lever.json";
import { mapGreenhouseJobs } from "../../pipeline/adapters/greenhouse";
import { mapLeverJobs } from "../../pipeline/adapters/lever";

describe("job source adapters", () => {
  it("maps published Greenhouse jobs", () => {
    const jobs = mapGreenhouseJobs(greenhouseFixture, "Anthropic", "anthropic-greenhouse", "2026-08-05T00:00:00.000Z");
    expect(jobs[0]).toMatchObject({ source: "greenhouse", company: "Anthropic" });
    expect(jobs[0].applyUrl).toMatch(/^https:/);
  });

  it("maps published Lever jobs", () => {
    const jobs = mapLeverJobs(leverFixture, "Binance", "binance-lever", "2026-08-05T00:00:00.000Z");
    expect(jobs[0]).toMatchObject({ source: "lever", company: "Binance" });
    expect(jobs[0].locations.length).toBeGreaterThan(0);
  });
});
```

- [x] **Step 2: Run and verify missing adapter failures**

Run: `cd site && npm run test:pipeline -- adapters.test.ts`

Expected: FAIL because adapter modules do not exist.

- [x] **Step 3: Define the adapter boundary**

```ts
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
```

- [x] **Step 4: Implement fixture-backed mapping and network adapters**

Greenhouse must call `https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs?content=true`, require `{ jobs: array }`, and map `id`, `title`, `location.name`, `content`, `absolute_url`, `first_published`, and `updated_at`.

Lever must call `https://api.lever.co/v0/postings/{siteName}?mode=json`, require a top-level array, and map `id`, `text`, `categories.allLocations` or `categories.location`, `descriptionPlain` plus list fields, `hostedUrl`, `applyUrl`, and `createdAt`.

Both adapters must throw `SourceContractError` for non-2xx responses or invalid JSON shape and must never return a job without `applyUrl`.

- [x] **Step 5: Add reviewed registry and a probe gate**

```json
[
  {
    "id": "anthropic-greenhouse",
    "provider": "greenhouse",
    "company": "Anthropic",
    "boardToken": "anthropic",
    "enabled": true,
    "termsUrl": "https://developer.greenhouse.io/job-board.html",
    "reviewedAt": "2026-08-05"
  },
  {
    "id": "binance-lever",
    "provider": "lever",
    "company": "Binance",
    "siteName": "binance",
    "enabled": true,
    "termsUrl": "https://github.com/lever/postings-api",
    "reviewedAt": "2026-08-05"
  }
]
```

`probe-sources.ts` must apply a 15-second `AbortSignal.timeout`, parse through the actual adapter, require at least one job, print `PASS <id> <count>` for valid entries, print `FAIL <id> <reason>` to stderr for failures, and exit 1 when any enabled entry fails.

- [x] **Step 6: Verify fixtures, then probe real public endpoints**

Run: `cd site && npm run test:pipeline -- adapters.test.ts probe-sources.test.ts`

Expected: fixture and probe tests PASS without network.

Run: `cd site && npm run data:probe`

Expected: both `PASS anthropic-greenhouse` and `PASS binance-lever`, each with a positive count. If an endpoint fails or returns an invalid shape, set that entry to `enabled: false`, find another current official Greenhouse/Lever board, add its fixture and test, and do not proceed until two enabled entries pass the same probe.

- [x] **Step 7: Commit the source layer**

```bash
git add site/data/source-registry.json site/pipeline/adapters site/pipeline/probe-sources.ts site/pipeline/fixtures site/tests/pipeline
git commit -m "feat: add reviewed public job source adapters"
```

### Task 4: Normalize, fingerprint, and deduplicate source jobs

**Files:**
- Create: `site/pipeline/normalize.ts`
- Create: `site/pipeline/dedupe.ts`
- Create: `site/tests/pipeline/normalize.test.ts`
- Create: `site/tests/pipeline/dedupe.test.ts`
- Create: `site/tests/fixtures/raw-jobs.ts`

- [x] **Step 1: Write failing normalization and dedupe tests**

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeRawJob } from "../../pipeline/normalize";
import { dedupeJobs } from "../../pipeline/dedupe";
import { rawGreenhouseJob, rawLeverDuplicate } from "../fixtures/raw-jobs";

describe("job normalization", () => {
  it("sanitizes HTML and creates a stable fingerprint", () => {
    const first = normalizeRawJob(rawGreenhouseJob);
    const second = normalizeRawJob({ ...rawGreenhouseJob, fetchedAt: "2026-08-06T00:00:00.000Z" });
    expect(first.description).not.toContain("<script");
    expect(first.contentFingerprint).toBe(second.contentFingerprint);
  });

  it("merges cross-source duplicates and keeps the most complete record", () => {
    const result = dedupeJobs([normalizeRawJob(rawGreenhouseJob), normalizeRawJob(rawLeverDuplicate)]);
    expect(result.jobs).toHaveLength(1);
    expect(result.duplicates[0].sourceIds).toHaveLength(2);
  });
});
```

- [x] **Step 2: Run and verify missing pipeline failures**

Run: `cd site && npm run test:pipeline -- normalize.test.ts dedupe.test.ts`

Expected: FAIL because normalization modules do not exist.

- [x] **Step 3: Implement deterministic normalization**

`normalizeRawJob` must:

1. remove script/style blocks and all HTML tags;
2. decode common HTML entities;
3. collapse whitespace;
4. normalize full-width punctuation and title casing without translating content;
5. classify language as `zh`, `en`, or `mixed` from Han/Latin character ratios;
6. normalize locations but preserve original strings;
7. derive workplace type from explicit `remote`, `hybrid`, `onsite`, `远程`, `混合`, or `现场` terms;
8. generate SHA-256 over normalized company, title, location, and description text;
9. set `id` to `${source}:${sourceJobId}` and `status` to `active`.

- [x] **Step 4: Implement conservative deduplication**

Merge jobs only when normalized company matches and either source job IDs match, fingerprints match, or normalized title + first location match with character-trigram Jaccard similarity at least `0.92`. Keep the latest non-null `updatedAt`, the longest clean description, all source URLs, and one canonical HTTPS apply URL. Never merge two jobs from different companies.

- [x] **Step 5: Run idempotence gate and commit**

Run: `cd site && npm run test:pipeline -- normalize.test.ts dedupe.test.ts`

Expected: all tests PASS, including same-input/same-fingerprint and non-merge controls.

```bash
git add site/pipeline/normalize.ts site/pipeline/dedupe.ts site/tests/pipeline site/tests/fixtures/raw-jobs.ts
git commit -m "feat: normalize and deduplicate public jobs"
```

### Task 5: Extract bilingual skills and classify target role families

**Files:**
- Create: `site/src/domain/taxonomy.ts`
- Create: `site/tests/domain/taxonomy.test.ts`

- [x] **Step 1: Write failing bilingual taxonomy tests**

```ts
import { describe, expect, it } from "vitest";
import { classifyRoleFamily, extractSkills, normalizeLocation } from "../../src/domain/taxonomy";

describe("job taxonomy", () => {
  it("extracts Chinese and English aliases without duplicates", () => {
    expect(extractSkills("熟悉 RAG、向量数据库 and prompt engineering")).toEqual([
      "rag", "vector-databases", "prompt-engineering",
    ]);
  });

  it("classifies an AI product role before generic data terms", () => {
    expect(classifyRoleFamily("AI 产品经理", ["user-research", "llm"])).toBe("ai-product");
  });

  it("recognizes the default Asia market", () => {
    expect(normalizeLocation("Remote - Asia / Hong Kong").marketScope).toBe("default");
  });
});
```

- [x] **Step 2: Run and verify failure**

Run: `cd site && npm run test:domain -- taxonomy.test.ts`

Expected: FAIL because the taxonomy module is missing.

- [x] **Step 3: Implement the fixed taxonomy**

Define canonical skills and Chinese/English aliases for at least: `data-analysis`, `machine-learning`, `nlp-embeddings`, `llm`, `rag`, `vector-databases`, `graph-analytics`, `causal-inference`, `experiment-design`, `data-visualization`, `product-discovery`, `user-research`, `stakeholder-management`, `business-analysis`, `solution-design`, `api-integration`, `frontend-engineering`, `mlops`, `responsible-ai`, `python`, `sql`, and `cloud`.

Classification precedence must be `people-analytics`, `ai-product`, `ai-solutions`, `ai-engineering`, `data-science`, then `other`; title matches weigh 3 and skill matches weigh 1. `normalizeLocation` must mark China mainland, Hong Kong, Singapore, and explicit APAC remote strings as `default`, all other locations as `global`, without inferring work authorization.

- [x] **Step 4: Verify bilingual regression and commit**

Run: `cd site && npm run test:domain -- taxonomy.test.ts`

Expected: all taxonomy tests PASS.

```bash
git add site/src/domain/taxonomy.ts site/tests/domain/taxonomy.test.ts
git commit -m "feat: add bilingual AI job taxonomy"
```

### Task 6: Build explainable matching and local JD analysis

**Files:**
- Create: `site/src/domain/matching.ts`
- Create: `site/tests/domain/matching.test.ts`
- Create: `site/tests/fixtures/jd-text.ts`
- Create: `site/tests/fixtures/jobs.ts`

- [x] **Step 1: Write failing scoring and evidence tests**

```ts
import { describe, expect, it } from "vitest";
import profile from "../../data/candidate-profile.json";
import { analyzeLocalJd, scoreJob } from "../../src/domain/matching";
import { parseCandidateProfile } from "../../src/domain/schemas";
import { aiProductJob } from "../fixtures/jobs";
import { LOCAL_AI_PM_JD } from "../fixtures/jd-text";

const candidateProfile = parseCandidateProfile(profile);

describe("explainable matching", () => {
  it("uses the approved five-component weights", () => {
    const result = scoreJob(aiProductJob, candidateProfile, { semanticPercentile: 80, mode: "e5" });
    const c = result.componentScores;
    expect(result.matchScore).toBe(Math.round(c.skill * .35 + c.evidence * .25 + c.semantic * .20 + c.adjacency * .10 + c.constraints * .10));
  });

  it("links every strength to a real evidence record", () => {
    const result = scoreJob(aiProductJob, candidateProfile, { semanticPercentile: 80, mode: "e5" });
    expect(result.matchedEvidence.length).toBeGreaterThan(0);
    expect(result.matchedEvidence.every(item => candidateProfile.evidence.some(e => e.id === item.evidenceId))).toBe(true);
  });

  it("analyzes pasted text locally and rejects navigation noise", () => {
    expect(analyzeLocalJd("首页 登录 下载 APP", candidateProfile)).toMatchObject({ ok: false, reason: "JD_TEXT_TOO_SHORT" });
    expect(analyzeLocalJd(LOCAL_AI_PM_JD, candidateProfile)).toMatchObject({ ok: true, analysis: { analysisMode: "local" } });
  });
});
```

- [x] **Step 2: Run and verify missing matching failures**

Run: `cd site && npm run test:domain -- matching.test.ts`

Expected: FAIL because `matching.ts` is missing.

- [x] **Step 3: Implement the five components and hard blockers**

Use exact weights `0.35/0.25/0.20/0.10/0.10`. Skill score is weighted candidate confidence across extracted job skills; evidence score is the weighted strongest evidence per required skill; semantic is the supplied E5 percentile; adjacency uses the exact profile-to-role-family values `{ "ai-product": 92, "ai-solutions": 90, "data-science": 94, "ai-engineering": 66, "people-analytics": 96, "other": 50 }`; constraints score only uses explicit profile/JD overlap and otherwise returns neutral `50` with an explanation. Explicit contradictory requirements add a `hardBlocker` and prevent `priority: true`.

Every strength must be created from a `matchedEvidence` item, every gap from an extracted JD skill absent below candidate confidence `0.55`, and the explanation must state analysis mode rather than imply an interview probability.

- [x] **Step 4: Implement browser-only JD analysis**

`analyzeLocalJd` must require at least 120 meaningful characters, strip navigation noise, extract skills and role family, calculate TF-IDF/character-trigram relevance against profile evidence, call `scoreJob` with `mode: "local"`, and return a discriminated union:

```ts
type LocalJdResult =
  | { ok: true; titleGuess: string; analysis: JobIntelligence }
  | { ok: false; reason: "JD_TEXT_TOO_SHORT" | "JD_TEXT_UNREADABLE" };
```

- [x] **Step 5: Run tests and commit**

Run: `cd site && npm run test:domain -- matching.test.ts`

Expected: all matching tests PASS.

```bash
git add site/src/domain/matching.ts site/tests/domain/matching.test.ts site/tests/fixtures/jd-text.ts site/tests/fixtures/jobs.ts
git commit -m "feat: add explainable job and local JD matching"
```

### Task 7: Compute role clusters and 7/30-day trends

**Files:**
- Create: `site/src/domain/clusters.ts`
- Create: `site/src/domain/trends.ts`
- Create: `site/tests/domain/clusters.test.ts`
- Create: `site/tests/domain/trends.test.ts`
- Create: `site/tests/fixtures/market-history.ts`

- [x] **Step 1: Write failing cluster and trend tests**

```ts
import { describe, expect, it } from "vitest";
import { buildClusterGraph } from "../../src/domain/clusters";
import { computeTrends } from "../../src/domain/trends";
import { historyFixture, scoredJobsFixture } from "../fixtures/market-history";

describe("market intelligence", () => {
  it("sizes role nodes by real jobs and links shared skills", () => {
    const graph = buildClusterGraph(scoredJobsFixture);
    expect(graph.nodes.reduce((sum, node) => sum + node.jobCount, 0)).toBe(scoredJobsFixture.length);
    expect(graph.edges.every(edge => edge.jaccard > 0 && edge.jaccard <= 1)).toBe(true);
  });

  it("suppresses skill momentum below five jobs", () => {
    const trend = computeTrends(historyFixture, "2026-08-05");
    expect(trend.skillStats.some(skill => skill.jobCount < 5)).toBe(false);
  });
});
```

- [x] **Step 2: Run and verify missing modules**

Run: `cd site && npm run test:domain -- clusters.test.ts trends.test.ts`

Expected: FAIL because cluster and trend modules are missing.

- [x] **Step 3: Implement an interpretable role-family graph**

Create one node per non-empty role family with `jobCount`, `delta7d`, top five skills, and top three companies. Create an edge only when skill-set Jaccard similarity is at least `0.18`; expose stable node positions from a fixed five-family layout so the SVG is deterministic and keyboard navigation does not shift between reloads.

- [x] **Step 4: Implement complete-period trends**

Compare the latest 7 complete calendar days with the preceding 7 and the latest 30 with the preceding 30. Count stable job IDs for new/removed jobs, calculate skill share with both numerator and denominator, exclude skills with fewer than five current jobs, and label all output `connected-sources-only`.

- [x] **Step 5: Run tests and commit**

Run: `cd site && npm run test:domain -- clusters.test.ts trends.test.ts`

Expected: all market-intelligence tests PASS.

```bash
git add site/src/domain/clusters.ts site/src/domain/trends.ts site/tests/domain site/tests/fixtures/market-history.ts
git commit -m "feat: derive job clusters and market trends"
```

### Task 8: Add pinned multilingual E5 scoring with deterministic fallback

**Files:**
- Create: `site/pipeline/embeddings/requirements-e5.txt`
- Create: `site/pipeline/embeddings/e5.py`
- Create: `site/pipeline/embeddings/e5-provider.ts`
- Create: `site/tests/pipeline/e5-provider.test.ts`
- Create: `site/tests/pipeline/e5_contract_test.py`
- Create: `site/tests/fixtures/semantic.ts`

- [x] **Step 1: Write a failing provider fallback test**

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scoreSemanticFit } from "../../pipeline/embeddings/e5-provider";
import { JOBS, PROFILE } from "../fixtures/semantic";

describe("E5 provider", () => {
  it("returns a named deterministic fallback when Python fails", async () => {
    const result = await scoreSemanticFit(PROFILE, JOBS, async () => { throw new Error("python unavailable"); });
    expect(result.mode).toBe("rules-fallback");
    expect(result.scores).toHaveLength(JOBS.length);
  });
});
```

- [x] **Step 2: Run and verify missing provider failure**

Run: `cd site && npm run test:pipeline -- e5-provider.test.ts`

Expected: FAIL because the provider is missing.

- [x] **Step 3: Pin the Python runtime contract**

`requirements-e5.txt` must contain:

```text
sentence-transformers==5.6.0
```

`e5.py` must load `intfloat/multilingual-e5-small` at revision `fd1525a9fd15316a2d503bf26ab031a61d056e98`, prefix candidate evidence with `query: `, prefix JD chunks with `passage: `, split inputs to at most 512 tokens, normalize embeddings, calculate the maximum evidence-to-chunk cosine for each job, and emit only JSON to stdout:

```json
{"modelRevision":"intfloat/multilingual-e5-small@fd1525a9","scores":[{"jobId":"job-1","cosine":0.8123}]}
```

The script must return exit code 2 for invalid stdin schema and write diagnostic messages only to stderr.

- [x] **Step 4: Implement the Node provider and percentile conversion**

Spawn `python3 pipeline/embeddings/e5.py`, pass profile/jobs JSON through stdin, enforce a 120-second timeout, validate output IDs, and convert cosines to stable cohort percentiles using average rank for ties. On spawn, timeout, exit, or validation failure, compute TF-IDF cosine scores and return `mode: "rules-fallback"` with model revision `tfidf-v1`.

- [x] **Step 5: Verify both fast and real contracts**

Run: `cd site && npm run test:pipeline -- e5-provider.test.ts`

Expected: PASS without downloading the model.

Run after installing Python dependencies: `cd site && python3 -m pip install -r pipeline/embeddings/requirements-e5.txt && python3 -m unittest tests/pipeline/e5_contract_test.py`

Expected: Python contract test PASS and output score count equals input job count.

- [x] **Step 6: Commit the semantic layer**

```bash
git add site/pipeline/embeddings site/tests/pipeline/e5-provider.test.ts site/tests/pipeline/e5_contract_test.py site/tests/fixtures/semantic.ts
git commit -m "feat: add pinned multilingual semantic scoring"
```

### Task 9: Orchestrate safe snapshots and last-good data artifacts

**Files:**
- Create: `site/pipeline/build-snapshot.ts`
- Create: `site/pipeline/run.ts`
- Create: `site/tests/pipeline/build-snapshot.test.ts`
- Create: `site/tests/fixtures/pipeline.ts`
- Create: `site/public/data/current.json`
- Create: `site/public/data/history.json`
- Create: `site/public/data/source-health.json`

- [x] **Step 1: Write a failing partial-source snapshot test**

```ts
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../../pipeline/build-snapshot";
import { failingAdapter, FIXED_SEMANTIC_PROVIDER, PREVIOUS_SNAPSHOT, successfulAdapter } from "../fixtures/pipeline";

describe("snapshot orchestration", () => {
  it("publishes valid jobs when one source fails and records source health", async () => {
    const result = await buildSnapshot({
      now: new Date("2026-08-05T04:00:00.000Z"),
      adapters: [successfulAdapter, failingAdapter],
      previous: PREVIOUS_SNAPSHOT,
      semanticProvider: FIXED_SEMANTIC_PROVIDER,
    });
    expect(result.snapshot.jobs.length).toBeGreaterThan(0);
    expect(result.snapshot.sourceHealth).toContainEqual(expect.objectContaining({ status: "failed" }));
  });
});
```

- [x] **Step 2: Run and verify missing orchestrator failure**

Run: `cd site && npm run test:pipeline -- build-snapshot.test.ts`

Expected: FAIL because `build-snapshot.ts` is missing.

- [x] **Step 3: Implement the orchestration boundary**

`buildSnapshot` must load only enabled reviewed sources, settle adapters independently, normalize/dedupe active jobs, keep only target AI role families, extract skills, call semantic scoring, calculate job intelligence, clusters and trends, compute `dataRevision` as SHA-256 over deterministic canonical JSON for the complete snapshot body excluding `dataRevision`, parse the final result through `parseMarketSnapshot`, and return snapshot/history/health objects without writing files.

`run.ts` must read the previous JSON files, call `buildSnapshot`, write all three outputs into a temporary sibling directory, parse them again, then atomically rename them into `public/data`. If validation or writing fails, leave the existing files unchanged and exit 1.

- [x] **Step 4: Generate a real last-good seed**

Run: `cd site && npm run data:probe && npm run data:update`

Expected: `public/data/current.json` parses successfully, contains at least two `sourceHealth` entries and at least 20 deduplicated current AI jobs; every job has an HTTPS source/apply URL and a non-empty explanation. If fewer than 20 remain, expand the reviewed registry with another current official Greenhouse or Lever board and repeat adapter fixture, probe, and terms review before continuing.

- [x] **Step 5: Run pipeline and contract gates, then commit**

Run: `cd site && npm run test:pipeline && npm run test:domain && npm run typecheck`

Expected: all pipeline/domain tests PASS and TypeScript exits 0.

```bash
git add site/pipeline/build-snapshot.ts site/pipeline/run.ts site/tests/pipeline/build-snapshot.test.ts site/tests/fixtures/pipeline.ts site/public/data
git commit -m "feat: publish validated real-job snapshots"
```

### Task 10: Load data, calculate freshness, and synchronize explorer state

**Files:**
- Create: `site/src/data/loadSnapshot.ts`
- Create: `site/src/state/useJobExplorer.ts`
- Create: `site/tests/domain/freshness.test.ts`
- Create: `site/tests/components/job-explorer-state.test.tsx`
- Modify: `site/src/RoleRadarApp.tsx`

- [x] **Step 1: Write failing freshness and URL-state tests**

```ts
import { describe, expect, it } from "vitest";
import { getFreshness } from "../../src/data/loadSnapshot";

describe("snapshot freshness", () => {
  const now = new Date("2026-08-05T12:00:00.000Z");
  it("marks eight hours as latest and the next millisecond delayed", () => {
    expect(getFreshness("2026-08-05T04:00:00.000Z", now).state).toBe("fresh");
    expect(getFreshness("2026-08-05T03:59:59.999Z", now).state).toBe("delayed");
  });
  it("marks data older than 24 hours stale", () => {
    expect(getFreshness("2026-08-04T11:59:59.999Z", now).state).toBe("stale");
  });
});
```

- [x] **Step 2: Run and verify missing loader failure**

Run: `cd site && npm run test:domain -- freshness.test.ts`

Expected: FAIL because `loadSnapshot.ts` is missing.

- [x] **Step 3: Implement validated loading and freshness**

`loadSnapshot(fetcher = fetch)` must request `./data/current.json`, reject non-2xx responses, parse JSON through `parseMarketSnapshot`, and throw a user-safe `SnapshotLoadError`. `getFreshness` returns `{ state: "fresh" | "delayed" | "stale", ageHours, label }` with inclusive 8-hour fresh and 24-hour delayed thresholds.

- [x] **Step 4: Implement query-backed explorer state**

`useJobExplorer` must initialize `q`, `location`, `family`, `source`, `sort`, and `job` from `URLSearchParams`; default location scope is `default`; default sort is `match`; invalid values are ignored. State changes use `history.replaceState`, filters are combined, and selection falls back to the first visible job.

- [ ] **Step 5: Wire loading states into the app and commit**

Render explicit loading, safe error with retry, and validated explorer states. Never render raw parse errors or internal paths.

Run: `cd site && npm run test:domain -- freshness.test.ts && npm run test:components -- job-explorer-state.test.tsx`

Expected: freshness and URL-state tests PASS.

```bash
git add site/src/data site/src/state site/src/RoleRadarApp.tsx site/tests/domain/freshness.test.ts site/tests/components/job-explorer-state.test.tsx
git commit -m "feat: load snapshots and synchronize explorer state"
```

### Task 11: Build the editorial market overview and source-health header

**Files:**
- Create: `site/src/components/AppHeader.tsx`
- Create: `site/src/components/MarketOverview.tsx`
- Create: `site/src/components/SourceHealthDialog.tsx`
- Create: `site/src/components/useDialogFocus.ts`
- Create: `site/src/styles/layout.css`
- Create: `site/src/styles/components.css`
- Create: `site/tests/components/market-overview.test.tsx`
- Modify: `site/src/RoleRadarApp.tsx`

- [ ] **Step 1: Write a failing overview interaction test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { validSnapshot } from "../fixtures/market-snapshot";

it("shows real counts, freshness, and source health", async () => {
  render(<RoleRadarApp initialSnapshot={validSnapshot} now={new Date("2026-08-05T04:00:00Z")} />);
  expect(screen.getByText(`${validSnapshot.activeJobCount}`)).toBeVisible();
  expect(screen.getByText("最新")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "查看数据源状态" }));
  expect(screen.getByRole("dialog", { name: "数据源健康状态" })).toBeVisible();
});
```

- [ ] **Step 2: Run and verify missing components**

Run: `cd site && npm run test:components -- market-overview.test.tsx`

Expected: FAIL because overview components are missing.

- [ ] **Step 3: Implement the header and four metric cards**

`AppHeader` must show product name, promise, last successful timestamp, freshness pill, `dataRevision` short digest, source-health button, and primary JD button. `MarketOverview` must render active count, new/removed 7-day counts, largest role family, and fastest-growing skill with both job count and sample denominator.

Port `useDialogFocus` unchanged from the old app and use it in `SourceHealthDialog`; the dialog lists every source's company, status, job count, fetched time, and message.

- [ ] **Step 4: Implement the exact editorial visual system**

Use the approved variables, 1px ink/fog borders, square-corner metric cards with one asymmetric rounded corner, mono source/time labels, blue selection, acid growth badges with ink text, and coral failure badges. The header title uses `clamp(3.2rem, 7vw, 7.4rem)` and no network font. Add reduced-motion rules and focus-visible outlines with at least 3:1 contrast.

- [ ] **Step 5: Run component and accessibility assertions, then commit**

Run: `cd site && npm run test:components -- market-overview.test.tsx`

Expected: test PASS; dialog receives focus and closes with Escape.

```bash
git add site/src/components site/src/styles site/src/RoleRadarApp.tsx site/tests/components/market-overview.test.tsx
git commit -m "feat: build editorial market intelligence overview"
```

### Task 12: Build the job explorer and explainable detail panel

**Files:**
- Create: `site/src/components/JobFilters.tsx`
- Create: `site/src/components/JobList.tsx`
- Create: `site/src/components/JobDetail.tsx`
- Create: `site/tests/components/job-explorer.test.tsx`
- Modify: `site/src/RoleRadarApp.tsx`
- Modify: `site/src/styles/layout.css`
- Modify: `site/src/styles/components.css`

- [ ] **Step 1: Write a failing end-user explorer test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { validSnapshot } from "../fixtures/market-snapshot";

it("filters jobs and exposes traceable evidence before applying", async () => {
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);
  await user.type(screen.getByRole("searchbox", { name: "搜索职位或公司" }), "Anthropic");
  expect(screen.getAllByTestId("job-row")).toHaveLength(1);
  await user.click(screen.getByTestId("job-row").querySelector("button")!);
  expect(screen.getByRole("heading", { name: /Anthropic/ })).toBeVisible();
  expect(screen.getByText("核心技能覆盖")).toBeVisible();
  expect(screen.getByText(/48 万余名劳动者/)).toBeVisible();
  expect(screen.getByRole("link", { name: "前往原站投递" })).toHaveAttribute("rel", expect.stringContaining("noopener"));
});
```

- [ ] **Step 2: Run and verify missing explorer failure**

Run: `cd site && npm run test:components -- job-explorer.test.tsx`

Expected: FAIL because explorer components are missing.

- [ ] **Step 3: Implement filters and accessible result list**

Add search, location scope, role family, source, freshness, and match-range controls plus sort options `match`, `updated`, and `growth`. Each row must expose company/title/location/source/updated time/match score and three evidence/skill tags. Use a real button per row with `aria-pressed`, not a clickable `div`; announce result counts with `aria-live="polite"`.

- [ ] **Step 4: Implement five-part details and original apply link**

Show all five component scores as text plus bars, matched JD requirement and candidate evidence pairs, strengths, gaps, hard blockers, analysis mode, model revision, source/fetched timestamps, sanitized JD excerpt, and original apply link. Never label the match score as probability. External links must use `target="_blank" rel="noopener noreferrer"`.

- [ ] **Step 5: Implement responsive split/drawer behavior**

At 1024px and above render list/detail columns; below 1024px render detail as a focus-trapped dialog using `useDialogFocus`; below 640px stack filters and list controls without removing fields. Ensure the selected job remains addressable through `?job=<id>`.

- [ ] **Step 6: Run tests and commit**

Run: `cd site && npm run test:components -- job-explorer.test.tsx && npm run typecheck`

Expected: explorer tests PASS and TypeScript exits 0.

```bash
git add site/src/components/JobFilters.tsx site/src/components/JobList.tsx site/src/components/JobDetail.tsx site/src/RoleRadarApp.tsx site/src/styles site/tests/components/job-explorer.test.tsx
git commit -m "feat: add explainable real-job explorer"
```

### Task 13: Add the real cluster map, local JD drawer, offline cache, and final E2E

**Files:**
- Create: `site/src/components/ClusterMap.tsx`
- Create: `site/src/components/JdAnalyzer.tsx`
- Create: `site/tests/components/cluster-map.test.tsx`
- Create: `site/tests/components/jd-analyzer.test.tsx`
- Replace: `site/e2e/interview-flow.spec.ts`
- Create: `site/e2e/public-access.spec.ts`
- Modify: `site/public/sw.js`
- Modify: `site/playwright.config.ts`
- Modify: `site/src/RoleRadarApp.tsx`
- Modify: `site/src/styles/components.css`

- [ ] **Step 1: Write failing cluster and JD interaction tests**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { RoleRadarApp } from "../../src/RoleRadarApp";
import { LOCAL_AI_PM_JD } from "../fixtures/jd-text";
import { validSnapshot } from "../fixtures/market-snapshot";

it("filters real jobs from a keyboard-accessible cluster node", async () => {
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);
  await userEvent.click(screen.getByRole("button", { name: /AI 产品岗位簇/ }));
  expect(screen.getByRole("status")).toHaveTextContent("已筛选");
});

it("analyzes JD text locally and keeps it out of persistence", async () => {
  const user = userEvent.setup();
  render(<RoleRadarApp initialSnapshot={validSnapshot} />);
  await user.click(screen.getByRole("button", { name: "分析一条 JD" }));
  await user.type(screen.getByRole("textbox", { name: "职位描述" }), LOCAL_AI_PM_JD);
  await user.click(screen.getByRole("button", { name: "开始本地分析" }));
  expect(screen.getByText("本地即时分析")).toBeVisible();
  expect(localStorage.length).toBe(0);
});
```

- [ ] **Step 2: Run and verify missing interaction failures**

Run: `cd site && npm run test:components -- cluster-map.test.tsx jd-analyzer.test.tsx`

Expected: FAIL because cluster/JD components are missing.

- [ ] **Step 3: Implement the SVG cluster map**

Render deterministic nodes from `buildClusterGraph`; node radius reflects job count, fill reflects signed 7-day change, and edges show Jaccard value in accessible descriptions. Each SVG node must have a corresponding keyboard button with the same label and filter action. Provide a legend that states “基于已接入真实岗位，不代表全市场”.

- [ ] **Step 4: Implement the JD analyzer drawer**

Use a focus-trapped bottom drawer with a textarea, sample-fill button, local-analysis button, clear button, privacy statement, result cards, and error state. If input is a URL, only fetch allowlisted Greenhouse/Lever public URLs; for BOSS/liepin hosts, show “平台限制自动读取，请复制职位描述” without requesting the URL. Do not use `localStorage`, `sessionStorage`, analytics, or remote model calls.

- [ ] **Step 5: Make the service worker data-aware**

Rename cache to `role-radar-v1`; precache `/`, `./favicon.svg`, `./og.png`, and `./data/current.json`; use network-first for navigation and current JSON, cache-first for hashed assets, and retain the last valid JSON response. Never cache failed or opaque responses.

- [ ] **Step 6: Replace E2E with the approved three-minute journey**

The desktop, tablet, and mobile projects must verify: public shell loads without auth UI; freshness/source labels render; at least 20 jobs appear in the real seed; filters change result count; selecting a job exposes evidence and apply link; cluster click filters jobs; pasted JD returns local analysis; focus remains inside dialogs; no horizontal overflow at 1440×900, 1024×768, and 390×844; after Service Worker control, offline reload still renders the cached snapshot.

Set Playwright's web server to `npm run dev -- --host 127.0.0.1 --port 4173` and add a `mobile` project at 390×844.

- [ ] **Step 7: Run complete UI/E2E gates and commit**

Run: `cd site && npm run test:components && npm run build && npm run test:e2e`

Expected: all component tests PASS, Vite build exits 0, and all three viewport projects PASS.

```bash
git add site/src/components/ClusterMap.tsx site/src/components/JdAnalyzer.tsx site/src/RoleRadarApp.tsx site/src/styles site/tests/components site/e2e site/public/sw.js site/playwright.config.ts
git commit -m "feat: complete RoleRadar interactive interview flow"
```

### Task 14: Remove obsolete demo code, publish Pages automation, and verify handoff

**Files:**
- Delete: `site/app/`
- Delete: `site/worker/`
- Delete: `site/build/`
- Delete: `site/next.config.ts`
- Delete: `site/.openai/hosting.json`
- Delete: `site/tests/CareerGraphApp.test.tsx`
- Delete: `site/tests/career-engine.test.mjs`
- Delete: `site/tests/rendered-html.test.mjs`
- Create: `.github/workflows/role-radar-pages.yml`
- Modify: `site/README.md`
- Create: `docs/role-radar-demo-script.md`
- Create: `docs/role-radar-validation.md`
- Modify: `site/public/favicon.svg`
- Replace: `site/public/og.png`

- [ ] **Step 1: Write a failing repository hygiene test**

Create `site/tests/pipeline/repository-hygiene.test.ts` that asserts package metadata contains `RoleRadar AI`, lockfile URLs use only `registry.npmjs.org`, public artifacts contain no email/phone/API-key patterns, `.openai/hosting.json` is absent, and source files contain none of `CareerGraph`, `curated demo`, `OpenAI login`, `vinext`, or `wrangler`.

- [ ] **Step 2: Run and verify the legacy-code failure**

Run: `cd site && npm run test:pipeline -- repository-hygiene.test.ts`

Expected: FAIL while old app/runtime files still exist.

- [ ] **Step 3: Remove only the obsolete paths and update metadata**

Delete the paths listed above after confirming `git status --short` contains no unrelated user changes. Update package name to `role-radar-ai`, version to `1.0.0`, description to `Public explainable AI job intelligence portfolio`, and README commands/data-boundary/model/deployment sections. Preserve the old version in Git history and the existing private production deployment until the new public URL passes acceptance.

- [ ] **Step 4: Add exact scheduled Pages workflow**

Create a workflow with `schedule: cron: "17 */4 * * *"` and `workflow_dispatch`; use `actions/checkout@v6`, `actions/setup-node@v5` with Node 22 and npm cache, `actions/setup-python@v6` with Python 3.12, cache `~/.cache/huggingface`, run `npm ci`, install `pipeline/embeddings/requirements-e5.txt`, restore the latest validated files from the `market-data` checkout, run `npm run data:probe`, `npm run data:update`, `npm run test:all`, and `npm run build`, then persist only `site/public/data/*.json` to `market-data` and deploy `site/dist` with `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`.

The workflow must use `contents: write`, `pages: write`, and `id-token: write`; one concurrency group cancels older refreshes; no secret value is printed; a failed probe/test/build must occur before data commit and Pages deployment.

- [ ] **Step 5: Prepare public repository and market-data branch with an explicit external-state gate**

Run `git remote -v` and inspect the connected GitHub account. If no approved remote exists, ask the user to confirm the target repository and whether source code may be public before creating or pushing it. Create a dedicated `market-data` branch containing only `current.json`, `history.json`, and `source-health.json`, and configure Pages to deploy from GitHub Actions. Do not delete or change the existing private Sites deployment.

- [ ] **Step 6: Run fresh local completion evidence**

Run:

```bash
cd site
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Expected: every command exits 0; test output reports no failures; all three viewport E2E projects pass.

- [ ] **Step 7: Verify the deployed public URL**

Open the GitHub Pages URL in an unsigned/incognito browser and verify: no OpenAI/ChatGPT/GitHub login redirect; current data timestamp and two source statuses visible; at least 20 real jobs; original apply link opens; JD local analysis works; desktop/tablet/mobile screenshots have no clipping; Lighthouse performance/accessibility/best-practices/SEO each score at least 90. Record exact command outputs, URL, `market-data` Git commit, public `dataRevision`, screenshots, and Lighthouse scores in `docs/role-radar-validation.md`.

- [ ] **Step 8: Add the three-minute interview script and commit**

`docs/role-radar-demo-script.md` must cover: product-discovery failure in the old version, real-source freshness, personal match evidence, cluster map, pasted JD, model/fallback boundary, and public deployment. `site/README.md` must link the design, plan, validation, public site, and source terms.

```bash
git add -A site .github/workflows/role-radar-pages.yml docs/role-radar-demo-script.md docs/role-radar-validation.md
git commit -m "release: prepare public RoleRadar portfolio"
```

## Specification coverage

| Approved specification | Implementation tasks |
|---|---|
| 1–3. Decision, goals, users, first visit, three-minute demo | Tasks 1, 10–14 |
| 4–5. Information architecture, interactions, responsive/editorial visual design | Tasks 1, 11–13 |
| 6. Real source scope, reviewed boards, BOSS/猎聘 import boundary | Tasks 3, 6, 13, 14 |
| 7. Adapter, normalization, AI, and presentation architecture | Tasks 1, 3–10 |
| 8. Public typed data models and anonymized candidate profile | Task 2 |
| 9. Five-part explainable fit and browser-local JD analysis | Tasks 6, 8, 13 |
| 10. Complete-period trend calculations | Tasks 7, 9, 11 |
| 11. Four-hour refresh, last-good data, and public deployment | Tasks 3, 9, 14 |
| 12. Partial-source, stale-data, invalid-JD, and offline errors | Tasks 3, 9, 10, 13, 14 |
| 13. Privacy, source terms, no browser secret, and data retention | Tasks 2, 3, 8, 9, 13, 14 |
| 14. Unit, contract, component, E2E, accessibility, and performance tests | Tasks 1–14 |
| 15. Public-access and data-quality acceptance | Tasks 9, 13, 14 |
| 16. Safe migration from CareerGraph | Tasks 1, 2, 11–14 |
| 17. Interview narrative and handoff | Task 14 |
| 18. Official source documentation | Tasks 3, 8, 14 |

## Plan completion checklist

- [x] Every specification section maps to at least one task above.
- [x] Every feature task begins with a failing test and records the expected failure.
- [ ] Greenhouse and Lever sources pass live probes before their data is published.
- [ ] E5 is pinned and has a named deterministic fallback.
- [ ] The browser never receives a secret or persists pasted JD text.
- [ ] No fabricated job is used outside test fixtures.
- [ ] Public access, data freshness, offline fallback, responsiveness, accessibility, and source attribution are verified before release.
- [ ] The old private deployment remains available until the new public site passes all acceptance checks.
