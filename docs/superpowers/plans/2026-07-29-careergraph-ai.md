# CareerGraph AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, offline-first CareerGraph AI web app that turns Yueer W.'s evidence-backed profile into three explainable AI-career transition routes, interactive scenario comparisons, and a traceable 90-day plan.

**Architecture:** A React + TypeScript single-page app consumes a pure domain layer for graph validation, scoring, explanation, and planning. Curated JSON data keeps the interview demo deterministic; an optional Live AI adapter is schema-gated and cannot modify scores. SVG renders the career graph, while component and browser tests prove the complete three-minute workflow.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, native SVG/CSS, Playwright.

---

## File Map

### Project and test configuration

- `package.json` — scripts and pinned dependency ranges.
- `tsconfig.json` — browser TypeScript configuration with JSON imports.
- `tsconfig.node.json` — Vite and test configuration typing.
- `vite.config.ts` — React and Vitest configuration.
- `playwright.config.ts` — local E2E server and desktop viewports.
- `index.html` — application mount document.
- `src/test/setup.ts` — DOM test matchers and browser API shims.

### Domain and data

- `src/domain/types.ts` — all shared domain types and score keys.
- `src/domain/graph.ts` — graph validation and node/route lookup.
- `src/domain/scoring.ts` — weight normalization, route components, ranking, and scenario deltas.
- `src/domain/explanations.ts` — evidence-backed strengths, gaps, and ranking-change narratives.
- `src/domain/planning.ts` — deterministic 0–30, 31–60, and 61–90 day plans.
- `src/domain/ai.ts` — Live AI contract, response validation, and stable-mode fallback.
- `src/data/demo-profile.json` — sanitized Yueer W. profile and evidence.
- `src/data/skills.json` — bilingual skill catalog.
- `src/data/roles.json` — current, bridge, and target roles.
- `src/data/transitions.json` — directed career-graph edges.
- `src/data/routes.json` — three curated route definitions.
- `src/data/index.ts` — typed data imports and exported demo dataset.

### UI

- `src/main.tsx` — React root.
- `src/App.tsx` — application state and region composition only.
- `src/styles.css` — design tokens, layout, component states, responsive and reduced-motion rules.
- `src/components/AppHeader.tsx` — product identity, mode status, and tour start.
- `src/components/ProfilePanel.tsx` — profile summary, skills, preferences, and scenario presets.
- `src/components/CareerGraph.tsx` — accessible SVG graph and node selection.
- `src/components/RouteCard.tsx` — one ranked route with score decomposition.
- `src/components/RouteComparison.tsx` — ranked list and selected-route coordination.
- `src/components/DetailDrawer.tsx` — evidence, score, plan, and model tabs.
- `src/components/TourOverlay.tsx` — five-step interview narration.
- `src/components/LiveAiDialog.tsx` — disabled/unconfigured Live AI explanation and adapter state.

### Tests and handoff

- `src/domain/graph.test.ts`
- `src/domain/scoring.test.ts`
- `src/domain/explanations.test.ts`
- `src/domain/planning.test.ts`
- `src/domain/ai.test.ts`
- `src/components/App.test.tsx`
- `e2e/demo.spec.ts`
- `README.md`
- `docs/interview-demo.md`

## Task 1: Scaffold the tested React application

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/test/setup.ts`
- Create: `src/components/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Write the failing smoke test**

```tsx
// src/components/App.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("introduces the product and its explainable decision promise", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /CareerGraph AI/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/看见、比较并质疑 AI 的职业决策依据/),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Add project configuration and install dependencies**

```json
// package.json
{
  "name": "careergraph-ai",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "check": "pnpm test && pnpm build && pnpm test:e2e"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "1.54.1",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@testing-library/user-event": "14.5.2",
    "@types/react": "18.3.12",
    "@types/react-dom": "18.3.1",
    "@vitejs/plugin-react": "4.3.4",
    "jsdom": "25.0.1",
    "typescript": "5.6.3",
    "vite": "5.4.19",
    "vitest": "2.1.9"
  }
}
```

```json
// tsconfig.json
{
  "files": [],
  "references": [{ "path": "./tsconfig.node.json" }],
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

```json
// tsconfig.node.json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

```ts
// vite.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

Run: `pnpm install`  
Expected: dependencies install and `pnpm-lock.yaml` is created.

- [ ] **Step 3: Run the smoke test to verify it fails**

Run: `pnpm test -- src/components/App.test.tsx`  
Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 4: Add the minimal application shell**

```html
<!-- index.html -->
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="CareerGraph AI — 可解释的职业跃迁智能实验室"
    />
    <title>CareerGraph AI</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

```tsx
// src/App.tsx
export default function App() {
  return (
    <main>
      <p>职业跃迁智能实验室</p>
      <h1>CareerGraph AI</h1>
      <p>看见、比较并质疑 AI 的职业决策依据。</p>
    </main>
  );
}
```

```tsx
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```css
/* src/styles.css */
:root {
  font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  color: #102126;
  background: #f4f1e8;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}
```

- [ ] **Step 5: Run test and build**

Run: `pnpm test -- src/components/App.test.tsx && pnpm build`  
Expected: one test passes and Vite emits `dist/`.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json tsconfig.node.json vite.config.ts index.html src
git commit -m "chore: scaffold tested CareerGraph app"
```

## Task 2: Define and validate the curated career dataset

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/graph.ts`
- Create: `src/domain/graph.test.ts`
- Create: `src/data/demo-profile.json`
- Create: `src/data/skills.json`
- Create: `src/data/roles.json`
- Create: `src/data/transitions.json`
- Create: `src/data/routes.json`
- Create: `src/data/index.ts`

- [ ] **Step 1: Add types and a failing integrity test**

```ts
// src/domain/types.ts
export type ScoreKey =
  | "skillTransfer"
  | "adjacency"
  | "evidence"
  | "aiLeverage"
  | "speed";

export type Weights = Record<ScoreKey, number>;

export interface Evidence {
  id: string;
  label: string;
  excerpt: string;
  sourceType: "resume" | "user_input";
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
  name: string;
  headline: string;
  summary: string;
  evidence: Evidence[];
  skills: CandidateSkill[];
  experienceSignals: string[];
}

export interface Skill {
  id: string;
  name: string;
  category: "ai-data" | "research" | "product" | "business" | "engineering";
}

export interface SkillRequirement {
  skillId: string;
  weight: number;
}

export interface Role {
  id: string;
  title: string;
  family: string;
  stage: "current" | "bridge" | "target";
  requiredSkills: SkillRequirement[];
  aiLeverage: number;
  typicalPrepMonths: number;
  description: string;
  position: { x: number; y: number };
}

export interface TransitionEdge {
  sourceRoleId: string;
  targetRoleId: string;
  adjacency: number;
  bridgeSkillIds: string[];
  rationale: string;
}

export interface ActionSeed {
  gapSkillId: string;
  deliverable: string;
  evidenceGoal: string;
}

export interface RouteDefinition {
  id: string;
  label: string;
  roleIds: string[];
  estimatedMonths: number;
  actionSeeds: ActionSeed[];
}

export interface DemoDataset {
  profile: CandidateProfile;
  skills: Skill[];
  roles: Role[];
  transitions: TransitionEdge[];
  routes: RouteDefinition[];
}

export interface ComponentScores {
  skillTransfer: number;
  adjacency: number;
  evidence: number;
  aiLeverage: number;
  speed: number;
}

export interface ScoredRoute extends RouteDefinition {
  targetRole: Role;
  componentScores: ComponentScores;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  evidenceIds: string[];
  changeReason: string;
}
```

```ts
// src/domain/graph.test.ts
import { describe, expect, it } from "vitest";
import { dataset } from "../data";
import { validateDataset } from "./graph";

describe("validateDataset", () => {
  it("accepts a graph with valid role, skill, evidence, edge, and route references", () => {
    expect(validateDataset(dataset)).toEqual([]);
  });

  it("reports a dangling transition role", () => {
    const broken = {
      ...dataset,
      transitions: [
        ...dataset.transitions,
        {
          sourceRoleId: "missing",
          targetRoleId: dataset.roles[0].id,
          adjacency: 50,
          bridgeSkillIds: [],
          rationale: "invalid",
        },
      ],
    };
    expect(validateDataset(broken)).toContain(
      "transition missing → current-is-researcher references an unknown role",
    );
  });
});
```

- [ ] **Step 2: Run the integrity test to verify it fails**

Run: `pnpm test -- src/domain/graph.test.ts`  
Expected: FAIL because data exports and `validateDataset` do not exist.

- [ ] **Step 3: Create the five JSON datasets**

Create the following exact JSON files:

```json
// src/data/skills.json
[
  { "id": "data-analysis", "name": "数据分析", "category": "ai-data" },
  { "id": "machine-learning", "name": "机器学习", "category": "ai-data" },
  { "id": "nlp-embeddings", "name": "NLP / 文本嵌入", "category": "ai-data" },
  { "id": "graph-analytics", "name": "图网络分析", "category": "ai-data" },
  { "id": "causal-inference", "name": "因果推断", "category": "research" },
  { "id": "experiment-design", "name": "实验设计", "category": "research" },
  { "id": "data-visualization", "name": "数据可视化", "category": "ai-data" },
  { "id": "product-discovery", "name": "产品发现", "category": "product" },
  { "id": "ux-research", "name": "用户研究", "category": "product" },
  { "id": "stakeholder-management", "name": "利益相关者管理", "category": "business" },
  { "id": "business-analysis", "name": "商业分析", "category": "business" },
  { "id": "solution-design", "name": "解决方案设计", "category": "business" },
  { "id": "api-integration", "name": "API 集成", "category": "engineering" },
  { "id": "frontend-engineering", "name": "前端工程", "category": "engineering" },
  { "id": "mlops", "name": "MLOps", "category": "engineering" },
  { "id": "responsible-ai", "name": "负责任 AI", "category": "research" }
]
```

```json
// src/data/demo-profile.json
{
  "id": "profile-yueer-w",
  "name": "Yueer W.",
  "headline": "信息系统博士 · 职业与人才数据研究者",
  "summary": "把职业网络、文本嵌入与因果推断转化为可解释的人才决策产品。",
  "evidence": [
    {
      "id": "ev-career-network",
      "label": "大规模职业网络研究",
      "excerpt": "基于 48 万余名劳动者纵向履历构建劳动力市场网络与个性化加权 PageRank。",
      "sourceType": "resume",
      "strength": 0.98,
      "skillIds": ["data-analysis", "graph-analytics", "data-visualization"]
    },
    {
      "id": "ev-nlp",
      "label": "岗位文本归一化",
      "excerpt": "使用 all-MiniLM-L6-v2 与 BGE-M3 完成岗位名称归一化及 SOC 映射。",
      "sourceType": "resume",
      "strength": 0.95,
      "skillIds": ["nlp-embeddings", "machine-learning", "data-analysis"]
    },
    {
      "id": "ev-causal",
      "label": "因果识别",
      "excerpt": "使用 CEM、DID、固定效应、事件研究和安慰剂检验识别职业回报。",
      "sourceType": "resume",
      "strength": 0.96,
      "skillIds": ["causal-inference", "experiment-design"]
    },
    {
      "id": "ev-supply-chain",
      "label": "供应链金融图谱",
      "excerpt": "参与企业画像、异构网络、风险传导与 FICO 风格信用评分方案。",
      "sourceType": "resume",
      "strength": 0.90,
      "skillIds": ["graph-analytics", "data-analysis", "business-analysis", "solution-design"]
    },
    {
      "id": "ev-recruitment",
      "label": "招聘漏斗优化",
      "excerpt": "识别 20 项流程效率提升点，推动 Offer 转化率提升 5%。",
      "sourceType": "resume",
      "strength": 0.88,
      "skillIds": ["data-analysis", "business-analysis", "stakeholder-management", "experiment-design"]
    },
    {
      "id": "ev-consulting",
      "label": "行业与战略咨询",
      "excerpt": "完成医药行业和企业扩张研究，将分析转化为咨询建议。",
      "sourceType": "resume",
      "strength": 0.82,
      "skillIds": ["business-analysis", "solution-design", "stakeholder-management"]
    },
    {
      "id": "ev-teaching",
      "label": "商业分析与机器学习教学",
      "excerpt": "辅导数据分析、商业编程与机器学习课程，最高评教 96.3%。",
      "sourceType": "resume",
      "strength": 0.90,
      "skillIds": ["machine-learning", "stakeholder-management", "data-visualization"]
    },
    {
      "id": "ev-ai-boundary",
      "label": "AI 分类与人工复核",
      "excerpt": "采用大语言模型辅助编码、人工复核与专家验证构建职业分类。",
      "sourceType": "resume",
      "strength": 0.76,
      "skillIds": ["responsible-ai", "product-discovery", "ux-research"]
    }
  ],
  "skills": [
    { "skillId": "data-analysis", "confidence": 0.96, "evidenceIds": ["ev-career-network", "ev-nlp", "ev-supply-chain", "ev-recruitment"] },
    { "skillId": "machine-learning", "confidence": 0.82, "evidenceIds": ["ev-nlp", "ev-teaching"] },
    { "skillId": "nlp-embeddings", "confidence": 0.90, "evidenceIds": ["ev-nlp"] },
    { "skillId": "graph-analytics", "confidence": 0.92, "evidenceIds": ["ev-career-network", "ev-supply-chain"] },
    { "skillId": "causal-inference", "confidence": 0.95, "evidenceIds": ["ev-causal"] },
    { "skillId": "experiment-design", "confidence": 0.88, "evidenceIds": ["ev-causal", "ev-recruitment"] },
    { "skillId": "data-visualization", "confidence": 0.85, "evidenceIds": ["ev-career-network", "ev-teaching"] },
    { "skillId": "product-discovery", "confidence": 0.58, "evidenceIds": ["ev-ai-boundary"] },
    { "skillId": "ux-research", "confidence": 0.50, "evidenceIds": ["ev-ai-boundary"] },
    { "skillId": "stakeholder-management", "confidence": 0.84, "evidenceIds": ["ev-recruitment", "ev-consulting", "ev-teaching"] },
    { "skillId": "business-analysis", "confidence": 0.90, "evidenceIds": ["ev-supply-chain", "ev-recruitment", "ev-consulting"] },
    { "skillId": "solution-design", "confidence": 0.66, "evidenceIds": ["ev-supply-chain", "ev-consulting"] },
    { "skillId": "api-integration", "confidence": 0.28, "evidenceIds": [] },
    { "skillId": "frontend-engineering", "confidence": 0.18, "evidenceIds": [] },
    { "skillId": "mlops", "confidence": 0.20, "evidenceIds": [] },
    { "skillId": "responsible-ai", "confidence": 0.76, "evidenceIds": ["ev-ai-boundary"] }
  ],
  "experienceSignals": [
    "48 万至 95 万劳动者纵向履历研究",
    "岗位文本嵌入与 SOC 映射",
    "职业网络与 PageRank",
    "CEM、DID 与事件研究",
    "招聘漏斗与供应链金融产业项目"
  ]
}
```

```json
// src/data/roles.json
[
  {
    "id": "current-is-researcher",
    "title": "信息系统研究者",
    "family": "research",
    "stage": "current",
    "requiredSkills": [
      { "skillId": "causal-inference", "weight": 0.30 },
      { "skillId": "data-analysis", "weight": 0.25 },
      { "skillId": "graph-analytics", "weight": 0.20 },
      { "skillId": "nlp-embeddings", "weight": 0.15 },
      { "skillId": "experiment-design", "weight": 0.10 }
    ],
    "aiLeverage": 72,
    "typicalPrepMonths": 0,
    "description": "研究 AI 与大数据背景下的职业流动和人才决策。",
    "position": { "x": 82, "y": 110 }
  },
  {
    "id": "current-talent-analyst",
    "title": "人才数据分析师",
    "family": "analytics",
    "stage": "current",
    "requiredSkills": [
      { "skillId": "data-analysis", "weight": 0.35 },
      { "skillId": "business-analysis", "weight": 0.25 },
      { "skillId": "data-visualization", "weight": 0.20 },
      { "skillId": "stakeholder-management", "weight": 0.20 }
    ],
    "aiLeverage": 58,
    "typicalPrepMonths": 0,
    "description": "用人才与运营数据识别流程问题并推动决策。",
    "position": { "x": 82, "y": 280 }
  },
  {
    "id": "current-business-analyst",
    "title": "商业分析师",
    "family": "business",
    "stage": "current",
    "requiredSkills": [
      { "skillId": "business-analysis", "weight": 0.35 },
      { "skillId": "stakeholder-management", "weight": 0.30 },
      { "skillId": "data-analysis", "weight": 0.20 },
      { "skillId": "solution-design", "weight": 0.15 }
    ],
    "aiLeverage": 50,
    "typicalPrepMonths": 0,
    "description": "把行业、运营和数据洞察转化为业务建议。",
    "position": { "x": 82, "y": 450 }
  },
  {
    "id": "bridge-ai-product-analyst",
    "title": "AI 产品分析师",
    "family": "product",
    "stage": "bridge",
    "requiredSkills": [
      { "skillId": "product-discovery", "weight": 0.25 },
      { "skillId": "experiment-design", "weight": 0.20 },
      { "skillId": "data-analysis", "weight": 0.20 },
      { "skillId": "stakeholder-management", "weight": 0.20 },
      { "skillId": "responsible-ai", "weight": 0.15 }
    ],
    "aiLeverage": 80,
    "typicalPrepMonths": 3,
    "description": "用用户问题、数据证据和模型边界定义 AI 产品机会。",
    "position": { "x": 346, "y": 92 }
  },
  {
    "id": "bridge-people-data-scientist",
    "title": "People Analytics 数据科学家",
    "family": "data-science",
    "stage": "bridge",
    "requiredSkills": [
      { "skillId": "data-analysis", "weight": 0.25 },
      { "skillId": "machine-learning", "weight": 0.20 },
      { "skillId": "causal-inference", "weight": 0.20 },
      { "skillId": "experiment-design", "weight": 0.15 },
      { "skillId": "data-visualization", "weight": 0.10 },
      { "skillId": "stakeholder-management", "weight": 0.10 }
    ],
    "aiLeverage": 84,
    "typicalPrepMonths": 3,
    "description": "将人才领域知识与预测、因果和实验方法结合。",
    "position": { "x": 346, "y": 230 }
  },
  {
    "id": "bridge-ai-solutions-consultant",
    "title": "AI 解决方案分析师",
    "family": "solutions",
    "stage": "bridge",
    "requiredSkills": [
      { "skillId": "business-analysis", "weight": 0.25 },
      { "skillId": "solution-design", "weight": 0.25 },
      { "skillId": "stakeholder-management", "weight": 0.20 },
      { "skillId": "data-analysis", "weight": 0.15 },
      { "skillId": "machine-learning", "weight": 0.15 }
    ],
    "aiLeverage": 76,
    "typicalPrepMonths": 2,
    "description": "把业务需求、数据条件和模型能力组织成可交付方案。",
    "position": { "x": 346, "y": 365 }
  },
  {
    "id": "bridge-responsible-ai-researcher",
    "title": "负责任 AI 研究员",
    "family": "responsible-ai",
    "stage": "bridge",
    "requiredSkills": [
      { "skillId": "responsible-ai", "weight": 0.30 },
      { "skillId": "causal-inference", "weight": 0.20 },
      { "skillId": "experiment-design", "weight": 0.20 },
      { "skillId": "machine-learning", "weight": 0.15 },
      { "skillId": "stakeholder-management", "weight": 0.15 }
    ],
    "aiLeverage": 88,
    "typicalPrepMonths": 4,
    "description": "评估模型对用户、岗位和组织决策的影响与风险。",
    "position": { "x": 346, "y": 500 }
  },
  {
    "id": "target-ai-product-manager",
    "title": "AI 产品经理",
    "family": "product",
    "stage": "target",
    "requiredSkills": [
      { "skillId": "product-discovery", "weight": 0.25 },
      { "skillId": "stakeholder-management", "weight": 0.20 },
      { "skillId": "experiment-design", "weight": 0.15 },
      { "skillId": "business-analysis", "weight": 0.15 },
      { "skillId": "nlp-embeddings", "weight": 0.10 },
      { "skillId": "responsible-ai", "weight": 0.08 },
      { "skillId": "data-analysis", "weight": 0.07 }
    ],
    "aiLeverage": 86,
    "typicalPrepMonths": 6,
    "description": "定义 AI 用户价值、评估路径与产品边界。",
    "position": { "x": 642, "y": 88 }
  },
  {
    "id": "target-data-scientist",
    "title": "数据科学家",
    "family": "data-science",
    "stage": "target",
    "requiredSkills": [
      { "skillId": "data-analysis", "weight": 0.20 },
      { "skillId": "machine-learning", "weight": 0.20 },
      { "skillId": "causal-inference", "weight": 0.15 },
      { "skillId": "nlp-embeddings", "weight": 0.15 },
      { "skillId": "graph-analytics", "weight": 0.10 },
      { "skillId": "experiment-design", "weight": 0.10 },
      { "skillId": "data-visualization", "weight": 0.10 }
    ],
    "aiLeverage": 94,
    "typicalPrepMonths": 5,
    "description": "将统计、机器学习和领域知识转化为可靠决策。",
    "position": { "x": 642, "y": 225 }
  },
  {
    "id": "target-ai-solutions-consultant",
    "title": "AI 解决方案顾问",
    "family": "solutions",
    "stage": "target",
    "requiredSkills": [
      { "skillId": "business-analysis", "weight": 0.22 },
      { "skillId": "stakeholder-management", "weight": 0.22 },
      { "skillId": "solution-design", "weight": 0.22 },
      { "skillId": "data-analysis", "weight": 0.12 },
      { "skillId": "machine-learning", "weight": 0.10 },
      { "skillId": "product-discovery", "weight": 0.07 },
      { "skillId": "responsible-ai", "weight": 0.05 }
    ],
    "aiLeverage": 80,
    "typicalPrepMonths": 4,
    "description": "连接业务目标、数据现实和 AI 技术取舍。",
    "position": { "x": 642, "y": 362 }
  },
  {
    "id": "target-ai-application-engineer",
    "title": "AI 应用工程师",
    "family": "engineering",
    "stage": "target",
    "requiredSkills": [
      { "skillId": "api-integration", "weight": 0.25 },
      { "skillId": "frontend-engineering", "weight": 0.20 },
      { "skillId": "machine-learning", "weight": 0.20 },
      { "skillId": "nlp-embeddings", "weight": 0.15 },
      { "skillId": "mlops", "weight": 0.15 },
      { "skillId": "responsible-ai", "weight": 0.05 }
    ],
    "aiLeverage": 100,
    "typicalPrepMonths": 9,
    "description": "把模型能力集成进可靠、可维护的用户应用。",
    "position": { "x": 642, "y": 500 }
  }
]
```

```json
// src/data/transitions.json
[
  {
    "sourceRoleId": "current-is-researcher",
    "targetRoleId": "bridge-ai-product-analyst",
    "adjacency": 78,
    "bridgeSkillIds": ["experiment-design", "product-discovery", "responsible-ai"],
    "rationale": "研究问题定义与实验设计可迁移到 AI 产品发现。"
  },
  {
    "sourceRoleId": "bridge-ai-product-analyst",
    "targetRoleId": "target-ai-product-manager",
    "adjacency": 84,
    "bridgeSkillIds": ["product-discovery", "stakeholder-management"],
    "rationale": "补齐产品取舍和跨团队交付后可承担端到端产品职责。"
  },
  {
    "sourceRoleId": "current-talent-analyst",
    "targetRoleId": "bridge-people-data-scientist",
    "adjacency": 90,
    "bridgeSkillIds": ["data-analysis", "causal-inference", "machine-learning"],
    "rationale": "人才数据和招聘业务经验形成直接领域优势。"
  },
  {
    "sourceRoleId": "bridge-people-data-scientist",
    "targetRoleId": "target-data-scientist",
    "adjacency": 82,
    "bridgeSkillIds": ["machine-learning", "experiment-design", "data-visualization"],
    "rationale": "将人才场景中的建模与实验能力推广到通用数据科学岗位。"
  },
  {
    "sourceRoleId": "current-business-analyst",
    "targetRoleId": "bridge-ai-solutions-consultant",
    "adjacency": 88,
    "bridgeSkillIds": ["business-analysis", "solution-design", "stakeholder-management"],
    "rationale": "咨询和业务分析可直接承接 AI 方案发现与价值论证。"
  },
  {
    "sourceRoleId": "bridge-ai-solutions-consultant",
    "targetRoleId": "target-ai-solutions-consultant",
    "adjacency": 92,
    "bridgeSkillIds": ["solution-design", "machine-learning", "responsible-ai"],
    "rationale": "补充模型边界和实施路径即可扩展为完整 AI 解决方案。"
  },
  {
    "sourceRoleId": "current-is-researcher",
    "targetRoleId": "bridge-responsible-ai-researcher",
    "adjacency": 82,
    "bridgeSkillIds": ["causal-inference", "experiment-design", "responsible-ai"],
    "rationale": "职业影响研究可迁移到 AI 风险、评估与治理。"
  },
  {
    "sourceRoleId": "bridge-people-data-scientist",
    "targetRoleId": "bridge-responsible-ai-researcher",
    "adjacency": 70,
    "bridgeSkillIds": ["experiment-design", "responsible-ai"],
    "rationale": "人才算法场景提供公平性和决策风险研究入口。"
  },
  {
    "sourceRoleId": "bridge-ai-product-analyst",
    "targetRoleId": "target-ai-application-engineer",
    "adjacency": 46,
    "bridgeSkillIds": ["api-integration", "frontend-engineering"],
    "rationale": "需要显著补强产品工程与模型集成能力。"
  },
  {
    "sourceRoleId": "bridge-responsible-ai-researcher",
    "targetRoleId": "target-ai-application-engineer",
    "adjacency": 58,
    "bridgeSkillIds": ["api-integration", "mlops", "responsible-ai"],
    "rationale": "评估能力需要通过工程化与监控能力转化为应用交付。"
  }
]
```

```json
// src/data/routes.json

```json
[
  {
    "id": "route-ai-product",
    "label": "AI 产品经理",
    "roleIds": [
      "current-is-researcher",
      "bridge-ai-product-analyst",
      "target-ai-product-manager"
    ],
    "estimatedMonths": 6,
    "actionSeeds": [
      {
        "gapSkillId": "product-discovery",
        "deliverable": "完成 8 次 AI 求职者访谈并形成机会地图",
        "evidenceGoal": "提交一份包含问题定义、取舍和验证指标的 PRD"
      },
      {
        "gapSkillId": "api-integration",
        "deliverable": "接入一个真实模型端点并实现失败回退",
        "evidenceGoal": "用演示视频证明稳定模式与 Live AI 模式边界"
      }
    ]
  },
  {
    "id": "route-people-data-science",
    "label": "People Analytics 数据科学家",
    "roleIds": [
      "current-talent-analyst",
      "bridge-people-data-scientist",
      "target-data-scientist"
    ],
    "estimatedMonths": 5,
    "actionSeeds": [
      {
        "gapSkillId": "mlops",
        "deliverable": "为评分引擎建立数据漂移与回归监控样例",
        "evidenceGoal": "展示从研究模型到可维护分析产品的迁移"
      }
    ]
  },
  {
    "id": "route-ai-solutions",
    "label": "AI 解决方案顾问",
    "roleIds": [
      "current-business-analyst",
      "bridge-ai-solutions-consultant",
      "target-ai-solutions-consultant"
    ],
    "estimatedMonths": 4,
    "actionSeeds": [
      {
        "gapSkillId": "solution-design",
        "deliverable": "完成一份从业务问题到模型边界的 AI 方案蓝图",
        "evidenceGoal": "用成本、风险和可解释性说明方案取舍"
      }
    ]
  }
]
```

```ts
// src/data/index.ts
import profile from "./demo-profile.json";
import skills from "./skills.json";
import roles from "./roles.json";
import transitions from "./transitions.json";
import routes from "./routes.json";
import type { DemoDataset } from "../domain/types";

export const dataset = {
  profile,
  skills,
  roles,
  transitions,
  routes,
} as DemoDataset;
```

- [ ] **Step 4: Implement graph validation and lookup**

```ts
// src/domain/graph.ts
import type { DemoDataset, Role, RouteDefinition, TransitionEdge } from "./types";

export function validateDataset(data: DemoDataset): string[] {
  const errors: string[] = [];
  const roleIds = new Set(data.roles.map((role) => role.id));
  const skillIds = new Set(data.skills.map((skill) => skill.id));
  const evidenceIds = new Set(data.profile.evidence.map((item) => item.id));

  for (const edge of data.transitions) {
    if (!roleIds.has(edge.sourceRoleId) || !roleIds.has(edge.targetRoleId)) {
      errors.push(
        `transition ${edge.sourceRoleId} → ${edge.targetRoleId} references an unknown role`,
      );
    }
    for (const skillId of edge.bridgeSkillIds) {
      if (!skillIds.has(skillId)) errors.push(`transition references unknown skill ${skillId}`);
    }
  }

  for (const skill of data.profile.skills) {
    if (!skillIds.has(skill.skillId)) errors.push(`profile references unknown skill ${skill.skillId}`);
    for (const evidenceId of skill.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) errors.push(`profile references unknown evidence ${evidenceId}`);
    }
  }

  for (const route of data.routes) {
    route.roleIds.forEach((id) => {
      if (!roleIds.has(id)) errors.push(`route ${route.id} references unknown role ${id}`);
    });
    for (let index = 0; index < route.roleIds.length - 1; index += 1) {
      if (!findEdge(data.transitions, route.roleIds[index], route.roleIds[index + 1])) {
        errors.push(`route ${route.id} has no edge at step ${index + 1}`);
      }
    }
  }

  return errors;
}

export function findRole(roles: Role[], id: string): Role {
  const role = roles.find((item) => item.id === id);
  if (!role) throw new Error(`Unknown role: ${id}`);
  return role;
}

export function findEdge(
  edges: TransitionEdge[],
  sourceRoleId: string,
  targetRoleId: string,
): TransitionEdge | undefined {
  return edges.find(
    (edge) =>
      edge.sourceRoleId === sourceRoleId && edge.targetRoleId === targetRoleId,
  );
}

export function routeRoles(data: DemoDataset, route: RouteDefinition): Role[] {
  return route.roleIds.map((id) => findRole(data.roles, id));
}
```

- [ ] **Step 5: Run integrity tests**

Run: `pnpm test -- src/domain/graph.test.ts`  
Expected: two tests pass and no curated-data errors are returned.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/domain/graph.ts src/domain/graph.test.ts src/data
git commit -m "feat: add validated career graph dataset"
```

## Task 3: Build the deterministic scoring engine

**Files:**
- Create: `src/domain/scoring.test.ts`
- Create: `src/domain/scoring.ts`

- [ ] **Step 1: Write failing scoring tests**

```ts
// src/domain/scoring.test.ts
import { describe, expect, it } from "vitest";
import { dataset } from "../data";
import {
  DEFAULT_WEIGHTS,
  PRESET_WEIGHTS,
  normalizeWeights,
  rankRoutes,
  rebalanceWeights,
} from "./scoring";

describe("weights", () => {
  it("normalizes arbitrary positive weights to one", () => {
    const result = normalizeWeights({
      skillTransfer: 30,
      adjacency: 20,
      evidence: 20,
      aiLeverage: 20,
      speed: 10,
    });
    expect(Object.values(result).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
    expect(result.skillTransfer).toBeCloseTo(0.3);
  });

  it("keeps the changed weight and redistributes the remainder", () => {
    const result = rebalanceWeights(DEFAULT_WEIGHTS, "speed", 0.3);
    expect(result.speed).toBeCloseTo(0.3);
    expect(Object.values(result).reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  });
});

describe("rankRoutes", () => {
  it("is deterministic and keeps every component in range", () => {
    const first = rankRoutes(dataset, DEFAULT_WEIGHTS, 6);
    const second = rankRoutes(dataset, DEFAULT_WEIGHTS, 6);
    expect(first).toEqual(second);
    for (const route of first) {
      expect(route.overallScore).toBeGreaterThanOrEqual(0);
      expect(route.overallScore).toBeLessThanOrEqual(100);
      for (const score of Object.values(route.componentScores)) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("changes at least one rank between business and technical scenarios", () => {
    const business = rankRoutes(dataset, PRESET_WEIGHTS.business, 6).map((r) => r.id);
    const technical = rankRoutes(dataset, PRESET_WEIGHTS.technical, 6).map((r) => r.id);
    expect(technical).not.toEqual(business);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/domain/scoring.test.ts`  
Expected: FAIL because `scoring.ts` does not exist.

- [ ] **Step 3: Implement normalization and component scoring**

```ts
// src/domain/scoring.ts
import { findEdge, routeRoles } from "./graph";
import type {
  CandidateProfile,
  ComponentScores,
  DemoDataset,
  Role,
  RouteDefinition,
  ScoreKey,
  ScoredRoute,
  Weights,
} from "./types";

const SCORE_KEYS: ScoreKey[] = [
  "skillTransfer",
  "adjacency",
  "evidence",
  "aiLeverage",
  "speed",
];

export const DEFAULT_WEIGHTS: Weights = {
  skillTransfer: 0.3,
  adjacency: 0.2,
  evidence: 0.2,
  aiLeverage: 0.2,
  speed: 0.1,
};

export const PRESET_WEIGHTS = {
  fastest: { skillTransfer: 0.3, adjacency: 0.15, evidence: 0.15, aiLeverage: 0.1, speed: 0.3 },
  technical: { skillTransfer: 0.3, adjacency: 0.1, evidence: 0.15, aiLeverage: 0.35, speed: 0.1 },
  business: { skillTransfer: 0.2, adjacency: 0.25, evidence: 0.3, aiLeverage: 0.1, speed: 0.15 },
} satisfies Record<string, Weights>;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function normalizeWeights(weights: Weights): Weights {
  const positive = SCORE_KEYS.map((key) => Math.max(0, weights[key]));
  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total === 0) return { ...DEFAULT_WEIGHTS };
  return Object.fromEntries(
    SCORE_KEYS.map((key, index) => [key, positive[index] / total]),
  ) as Weights;
}

export function rebalanceWeights(
  current: Weights,
  changedKey: ScoreKey,
  nextValue: number,
): Weights {
  const selected = Math.max(0, Math.min(1, nextValue));
  const otherKeys = SCORE_KEYS.filter((key) => key !== changedKey);
  const otherTotal = otherKeys.reduce((sum, key) => sum + current[key], 0);
  const remainder = 1 - selected;
  const result = { ...current, [changedKey]: selected };
  for (const key of otherKeys) {
    result[key] = otherTotal === 0 ? remainder / otherKeys.length : (current[key] / otherTotal) * remainder;
  }
  return result;
}

function candidateSkill(profile: CandidateProfile, skillId: string) {
  return profile.skills.find((skill) => skill.skillId === skillId);
}

function skillCoverage(profile: CandidateProfile, role: Role): number {
  const total = role.requiredSkills.reduce((sum, item) => sum + item.weight, 0);
  const covered = role.requiredSkills.reduce(
    (sum, item) => sum + item.weight * (candidateSkill(profile, item.skillId)?.confidence ?? 0),
    0,
  );
  return clamp((covered / total) * 100);
}

function evidenceCoverage(profile: CandidateProfile, role: Role): number {
  const evidenceMap = new Map(profile.evidence.map((item) => [item.id, item.strength]));
  const weighted = role.requiredSkills.reduce((sum, item) => {
    const skill = candidateSkill(profile, item.skillId);
    const strongest = Math.max(0, ...(skill?.evidenceIds.map((id) => evidenceMap.get(id) ?? 0) ?? []));
    return sum + item.weight * strongest;
  }, 0);
  const total = role.requiredSkills.reduce((sum, item) => sum + item.weight, 0);
  return clamp((weighted / total) * 100);
}

function adjacencyScore(data: DemoDataset, route: RouteDefinition): number {
  const values = route.roleIds.slice(0, -1).map((source, index) => {
    const edge = findEdge(data.transitions, source, route.roleIds[index + 1]);
    if (!edge) throw new Error(`Missing route edge for ${route.id}`);
    return edge.adjacency / 100;
  });
  const geometricMean = Math.pow(
    values.reduce((product, value) => product * value, 1),
    1 / values.length,
  );
  const lengthPenalty = Math.max(0.85, 1 - Math.max(0, values.length - 1) * 0.04);
  return clamp(geometricMean * lengthPenalty * 100);
}

function aiLeverageScore(profile: CandidateProfile, role: Role): number {
  const aiSkills = profile.skills.filter((skill) =>
    ["machine-learning", "nlp-embeddings", "graph-analytics", "responsible-ai"].includes(skill.skillId),
  );
  const candidateReadiness =
    aiSkills.reduce((sum, skill) => sum + skill.confidence, 0) / aiSkills.length;
  return clamp(role.aiLeverage * (0.72 + candidateReadiness * 0.28));
}

function speedScore(route: RouteDefinition, horizonMonths: number): number {
  const latePenalty = Math.max(0, route.estimatedMonths - horizonMonths) * 8;
  const durationPenalty = Math.max(0, route.estimatedMonths - 3) * 2;
  return clamp(100 - latePenalty - durationPenalty);
}

export function componentScores(
  data: DemoDataset,
  route: RouteDefinition,
  horizonMonths: number,
): ComponentScores {
  const targetRole = routeRoles(data, route).at(-1)!;
  return {
    skillTransfer: skillCoverage(data.profile, targetRole),
    adjacency: adjacencyScore(data, route),
    evidence: evidenceCoverage(data.profile, targetRole),
    aiLeverage: aiLeverageScore(data.profile, targetRole),
    speed: speedScore(route, horizonMonths),
  };
}

export function rankRoutes(
  data: DemoDataset,
  rawWeights: Weights,
  horizonMonths: number,
): ScoredRoute[] {
  const weights = normalizeWeights(rawWeights);
  return data.routes
    .map((route) => {
      const scores = componentScores(data, route, horizonMonths);
      const overallScore = Math.round(
        SCORE_KEYS.reduce((sum, key) => sum + scores[key] * weights[key], 0),
      );
      return {
        ...route,
        targetRole: routeRoles(data, route).at(-1)!,
        componentScores: scores,
        overallScore,
        strengths: [],
        gaps: [],
        evidenceIds: [],
        changeReason: "当前为推荐权重。",
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore || a.label.localeCompare(b.label, "zh-CN"));
}
```

- [ ] **Step 4: Run tests and tune curated role weights only if the scenario-order test fails**

Run: `pnpm test -- src/domain/scoring.test.ts`  
Expected: four tests pass. If the two scenario orders are identical, adjust only `roles.json` skill weights, `transitions.json` adjacency values, or route preparation months until the business and technical presets yield different orders; do not add special-case route IDs to the scoring engine.

- [ ] **Step 5: Commit**

```bash
git add src/domain/scoring.ts src/domain/scoring.test.ts src/data
git commit -m "feat: add explainable career route scoring"
```

## Task 4: Generate traceable explanations, plans, and AI fallback

**Files:**
- Create: `src/domain/explanations.test.ts`
- Create: `src/domain/explanations.ts`
- Create: `src/domain/planning.test.ts`
- Create: `src/domain/planning.ts`
- Create: `src/domain/ai.test.ts`
- Create: `src/domain/ai.ts`

- [ ] **Step 1: Write failing explanation and planning tests**

```ts
// src/domain/explanations.test.ts
import { describe, expect, it } from "vitest";
import { dataset } from "../data";
import { DEFAULT_WEIGHTS, PRESET_WEIGHTS, rankRoutes } from "./scoring";
import { enrichRoutes, explainRankingChange } from "./explanations";

describe("route explanations", () => {
  it("backs every enriched route with evidence and explicit gaps", () => {
    const routes = enrichRoutes(dataset, rankRoutes(dataset, DEFAULT_WEIGHTS, 6));
    for (const route of routes) {
      expect(route.evidenceIds.length).toBeGreaterThan(0);
      expect(route.strengths.length).toBeGreaterThanOrEqual(2);
      expect(route.gaps.length).toBeGreaterThan(0);
    }
  });

  it("names the dominant changed factor", () => {
    const before = rankRoutes(dataset, DEFAULT_WEIGHTS, 6)[0];
    const after = rankRoutes(dataset, PRESET_WEIGHTS.technical, 6).find((r) => r.id === before.id)!;
    expect(explainRankingChange(before, after, DEFAULT_WEIGHTS, PRESET_WEIGHTS.technical)).toMatch(
      /技术|AI|技能|证据|速度|邻近/,
    );
  });
});
```

```ts
// src/domain/planning.test.ts
import { describe, expect, it } from "vitest";
import { dataset } from "../data";
import { buildNinetyDayPlan } from "./planning";

describe("buildNinetyDayPlan", () => {
  it("returns three ordered phases with concrete evidence goals", () => {
    const route = dataset.routes[0];
    const plan = buildNinetyDayPlan(route, dataset.skills);
    expect(plan.map((phase) => phase.range)).toEqual(["0–30 天", "31–60 天", "61–90 天"]);
    expect(plan.every((phase) => phase.actions.every((action) => action.evidenceGoal.length > 0))).toBe(true);
  });
});
```

- [ ] **Step 2: Write the failing AI contract tests**

```ts
// src/domain/ai.test.ts
import { describe, expect, it, vi } from "vitest";
import { analyzeProfileWithFallback, validateLiveAiProfile } from "./ai";

const valid = {
  headline: "人才数据研究者",
  summary: "研究职业流动与 AI 转型。",
  skills: [{ name: "因果推断", confidence: 0.9, evidence: "DID 与事件研究" }],
};

describe("Live AI boundary", () => {
  it("rejects invented or malformed evidence structures", () => {
    expect(validateLiveAiProfile({ headline: "", skills: "many" }).ok).toBe(false);
  });

  it("falls back without losing the user text", async () => {
    const adapter = { analyze: vi.fn().mockRejectedValue(new Error("timeout")) };
    const result = await analyzeProfileWithFallback("我的经历", adapter);
    expect(result.mode).toBe("stable");
    expect(result.notice).toMatch(/已回退到稳定演示模式/);
    expect(result.originalText).toBe("我的经历");
  });

  it("accepts a schema-valid adapter result", () => {
    expect(validateLiveAiProfile(valid).ok).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- src/domain/explanations.test.ts src/domain/planning.test.ts src/domain/ai.test.ts`  
Expected: FAIL because the three modules do not exist.

- [ ] **Step 4: Implement evidence enrichment and change explanations**

```ts
// src/domain/explanations.ts
import type { DemoDataset, ScoredRoute, ScoreKey, Weights } from "./types";

const LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能迁移",
  adjacency: "职业邻近",
  evidence: "证据强度",
  aiLeverage: "AI 杠杆",
  speed: "转型速度",
};

export function enrichRoutes(data: DemoDataset, routes: ScoredRoute[]): ScoredRoute[] {
  const skillMap = new Map(data.skills.map((skill) => [skill.id, skill.name]));
  const profileSkills = new Map(data.profile.skills.map((skill) => [skill.skillId, skill]));
  return routes.map((route) => {
    const requirements = [...route.targetRole.requiredSkills].sort((a, b) => b.weight - a.weight);
    const strengths = requirements
      .filter((requirement) => (profileSkills.get(requirement.skillId)?.confidence ?? 0) >= 0.72)
      .slice(0, 3)
      .map((requirement) => skillMap.get(requirement.skillId) ?? requirement.skillId);
    const gaps = requirements
      .filter((requirement) => (profileSkills.get(requirement.skillId)?.confidence ?? 0) < 0.65)
      .slice(0, 2)
      .map((requirement) => skillMap.get(requirement.skillId) ?? requirement.skillId);
    const evidenceIds = Array.from(
      new Set(
        requirements.flatMap(
          (requirement) => profileSkills.get(requirement.skillId)?.evidenceIds ?? [],
        ),
      ),
    );
    return {
      ...route,
      strengths,
      gaps: gaps.length > 0 ? gaps : ["目标岗位情境化作品证据"],
      evidenceIds,
    };
  });
}

export function explainRankingChange(
  before: ScoredRoute,
  after: ScoredRoute,
  previous: Weights,
  next: Weights,
): string {
  const key = (Object.keys(next) as ScoreKey[]).sort(
    (a, b) => Math.abs(next[b] - previous[b]) - Math.abs(next[a] - previous[a]),
  )[0];
  const direction = next[key] >= previous[key] ? "提高" : "降低";
  const delta = after.overallScore - before.overallScore;
  return `${direction}${LABELS[key]}权重后，该路径${delta >= 0 ? "增加" : "减少"} ${Math.abs(delta)} 分。`;
}
```

- [ ] **Step 5: Implement the deterministic 90-day plan**

```ts
// src/domain/planning.ts
import type { RouteDefinition, Skill } from "./types";

export interface PlanAction {
  title: string;
  deliverable: string;
  evidenceGoal: string;
}

export interface PlanPhase {
  range: "0–30 天" | "31–60 天" | "61–90 天";
  label: string;
  actions: PlanAction[];
}

export function buildNinetyDayPlan(route: RouteDefinition, skills: Skill[]): PlanPhase[] {
  const skillMap = new Map(skills.map((skill) => [skill.id, skill.name]));
  const seeds = route.actionSeeds.length > 0 ? route.actionSeeds : [{
    gapSkillId: "experiment-design",
    deliverable: "完成一个目标岗位情境化案例",
    evidenceGoal: "形成可在面试中展示的决策与复盘记录",
  }];
  const at = (index: number) => seeds[index % seeds.length];
  return [
    {
      range: "0–30 天",
      label: "验证问题",
      actions: [{
        title: `补齐 ${skillMap.get(at(0).gapSkillId) ?? at(0).gapSkillId}`,
        deliverable: at(0).deliverable,
        evidenceGoal: at(0).evidenceGoal,
      }],
    },
    {
      range: "31–60 天",
      label: "做出证据",
      actions: [{
        title: "把方法变成可操作原型",
        deliverable: `围绕「${route.label}」完成可交互版本并记录取舍`,
        evidenceGoal: "获得 3 位目标用户的任务完成反馈",
      }],
    },
    {
      range: "61–90 天",
      label: "形成信号",
      actions: [{
        title: "打磨面试叙事",
        deliverable: "完成三分钟演示、技术架构图和失败复盘",
        evidenceGoal: "能够分别回答产品、数据和工程三类追问",
      }],
    },
  ];
}
```

- [ ] **Step 6: Implement the schema-gated AI adapter**

```ts
// src/domain/ai.ts
export interface LiveAiSkill {
  name: string;
  confidence: number;
  evidence: string;
}

export interface LiveAiProfile {
  headline: string;
  summary: string;
  skills: LiveAiSkill[];
}

export interface LiveAiAdapter {
  analyze(text: string): Promise<unknown>;
}

export type LiveAiResult =
  | { mode: "live"; profile: LiveAiProfile; originalText: string; notice: string }
  | { mode: "stable"; originalText: string; notice: string };

export function validateLiveAiProfile(value: unknown):
  | { ok: true; value: LiveAiProfile }
  | { ok: false; reason: string } {
  if (!value || typeof value !== "object") return { ok: false, reason: "响应不是对象" };
  const item = value as Record<string, unknown>;
  if (typeof item.headline !== "string" || item.headline.trim().length < 2) {
    return { ok: false, reason: "缺少有效 headline" };
  }
  if (typeof item.summary !== "string" || !Array.isArray(item.skills)) {
    return { ok: false, reason: "缺少 summary 或 skills" };
  }
  const validSkills = item.skills.every((skill) => {
    if (!skill || typeof skill !== "object") return false;
    const entry = skill as Record<string, unknown>;
    return (
      typeof entry.name === "string" &&
      typeof entry.confidence === "number" &&
      entry.confidence >= 0 &&
      entry.confidence <= 1 &&
      typeof entry.evidence === "string" &&
      entry.evidence.trim().length > 0
    );
  });
  return validSkills
    ? { ok: true, value: item as unknown as LiveAiProfile }
    : { ok: false, reason: "skills 结构不合法" };
}

export async function analyzeProfileWithFallback(
  originalText: string,
  adapter: LiveAiAdapter,
): Promise<LiveAiResult> {
  try {
    const raw = await adapter.analyze(originalText);
    const parsed = validateLiveAiProfile(raw);
    if (!parsed.ok) throw new Error(parsed.reason);
    return {
      mode: "live",
      profile: parsed.value,
      originalText,
      notice: "Live AI 已完成结构化；分数仍由本地引擎计算。",
    };
  } catch {
    return {
      mode: "stable",
      originalText,
      notice: "Live AI 不可用，已回退到稳定演示模式。",
    };
  }
}
```

- [ ] **Step 7: Run domain tests**

Run: `pnpm test -- src/domain`  
Expected: graph, scoring, explanation, planning, and AI tests all pass.

- [ ] **Step 8: Commit**

```bash
git add src/domain
git commit -m "feat: add traceable reasoning and AI fallback"
```

## Task 5: Build the editorial dashboard shell

**Files:**
- Create: `src/components/AppHeader.tsx`
- Create: `src/components/ProfilePanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/components/App.test.tsx`

- [ ] **Step 1: Extend the component test for the dashboard regions**

```tsx
// append inside src/components/App.test.tsx
it("renders the profile, graph, routes, and evidence regions", () => {
  render(<App />);
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "候选人画像与偏好" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "职业跃迁图谱" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "路径比较" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "开始三分钟讲解" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `pnpm test -- src/components/App.test.tsx`  
Expected: FAIL because the four accessible regions are absent.

- [ ] **Step 3: Implement header and profile panel shells**

```tsx
// src/components/AppHeader.tsx
interface AppHeaderProps {
  onStartTour: () => void;
}

export function AppHeader({ onStartTour }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Career intelligence / curated demo</p>
        <h1>CareerGraph <span>AI</span></h1>
        <p>看见、比较并质疑 AI 的职业决策依据。</p>
      </div>
      <div className="header-actions">
        <button className="mode-pill" type="button">● 稳定演示</button>
        <button className="primary-button" type="button" onClick={onStartTour}>
          开始三分钟讲解
        </button>
      </div>
    </header>
  );
}
```

```tsx
// src/components/ProfilePanel.tsx
import type { CandidateProfile, Weights } from "../domain/types";

interface ProfilePanelProps {
  profile: CandidateProfile;
  weights: Weights;
}

export function ProfilePanel({ profile }: ProfilePanelProps) {
  return (
    <section className="profile-panel" aria-label="候选人画像与偏好">
      <p className="section-index">01 / PROFILE</p>
      <h2>{profile.name}</h2>
      <p className="profile-headline">{profile.headline}</p>
      <p>{profile.summary}</p>
      <div className="skill-cloud">
        {profile.skills.slice(0, 7).map((skill) => (
          <span key={skill.skillId}>{skill.skillId}</span>
        ))}
      </div>
    </section>
  );
}
```

```tsx
// src/App.tsx
import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ProfilePanel } from "./components/ProfilePanel";
import { dataset } from "./data";
import { DEFAULT_WEIGHTS } from "./domain/scoring";

export default function App() {
  const [tourRequested, setTourRequested] = useState(false);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <AppHeader onStartTour={() => setTourRequested(true)} />
      <main id="main-content" className="workspace">
        <ProfilePanel profile={dataset.profile} weights={DEFAULT_WEIGHTS} />
        <section className="graph-panel" aria-label="职业跃迁图谱">
          <p className="section-index">02 / MAP</p>
          <h2>职业跃迁图谱</h2>
          <p>当前角色、桥接角色与目标角色将在这里形成可追溯路径。</p>
        </section>
        <section className="route-panel" aria-label="路径比较">
          <p className="section-index">03 / ROUTES</p>
          <h2>路径比较</h2>
          <p>三条路径将按技能、邻近、证据、AI 杠杆和速度比较。</p>
        </section>
      </main>
      {tourRequested && (
        <div className="tour-request" role="status">
          讲解模式已准备；完整五步引导将在证据模块接入后启用。
          <button type="button" onClick={() => setTourRequested(false)}>关闭</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Implement the full design-token and layout foundation**

In `src/styles.css`, define:

```css
:root {
  font-family: Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  color: #102126;
  background: #f4f1e8;
  font-synthesis: none;
  --paper: #f4f1e8;
  --ink: #102126;
  --teal: #196c63;
  --coral: #d96c4a;
  --amber: #d7a43b;
  --mist: #dce5de;
  --line: rgba(16, 33, 38, 0.17);
  --mono: "IBM Plex Mono", ui-monospace, monospace;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background:
    linear-gradient(rgba(16, 33, 38, 0.025) 1px, transparent 1px),
    var(--paper);
  background-size: 100% 36px;
}

button, input {
  font: inherit;
}

button:focus-visible, input:focus-visible, [tabindex]:focus-visible {
  outline: 3px solid rgba(217, 108, 74, 0.45);
  outline-offset: 3px;
}

.app-shell {
  width: min(1600px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px clamp(20px, 3vw, 48px) 40px;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(240px, 3fr) minmax(420px, 5fr) minmax(320px, 4fr);
  gap: 16px;
  align-items: start;
}

.profile-panel, .graph-panel, .route-panel {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 18px 50px rgba(16, 33, 38, 0.06);
}

@media (max-width: 1100px) {
  .workspace { grid-template-columns: 1fr 1.4fr; }
  .route-panel { grid-column: 1 / -1; }
}

@media (max-width: 760px) {
  .workspace { grid-template-columns: 1fr; }
  .route-panel { grid-column: auto; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

Append these exact component styles:

```css
.skip-link {
  position: fixed;
  top: 8px;
  left: 12px;
  z-index: 100;
  padding: 10px 14px;
  color: white;
  background: var(--ink);
  border-radius: 999px;
  transform: translateY(-160%);
}

.skip-link:focus {
  transform: translateY(0);
}

.app-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 0 26px;
  border-bottom: 1px solid var(--ink);
  margin-bottom: 16px;
}

.app-header h1,
.profile-panel h2,
.graph-panel h2,
.route-panel h2 {
  margin: 0;
  letter-spacing: -0.045em;
}

.app-header h1 {
  font-size: clamp(2.5rem, 5vw, 5.3rem);
  line-height: 0.95;
}

.app-header h1 span {
  color: var(--coral);
}

.app-header > div > p:last-child {
  max-width: 560px;
  margin: 12px 0 0;
  font-size: 1.03rem;
}

.eyebrow,
.section-index,
.data-note {
  margin: 0 0 10px;
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.primary-button,
.mode-pill,
.tour-request button {
  min-height: 42px;
  padding: 0 16px;
  border: 1px solid var(--ink);
  border-radius: 999px;
  cursor: pointer;
}

.primary-button {
  color: white;
  background: var(--ink);
}

.primary-button:hover {
  background: var(--teal);
}

.mode-pill {
  color: var(--teal);
  background: transparent;
}

.profile-panel,
.graph-panel,
.route-panel {
  min-height: 610px;
  padding: 22px;
}

.profile-headline {
  color: var(--teal);
  font-weight: 700;
}

.skill-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
}

.skill-cloud span {
  padding: 7px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-family: var(--mono);
  font-size: 0.72rem;
  background: rgba(220, 229, 222, 0.6);
}

.tour-request {
  position: fixed;
  right: 24px;
  bottom: 24px;
  max-width: 360px;
  padding: 16px;
  color: white;
  background: var(--ink);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(16, 33, 38, 0.25);
}

.tour-request button {
  margin-left: 10px;
  color: var(--ink);
  background: var(--paper);
}

@media (max-width: 760px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
```

Do not add remote fonts, purple gradients, glassmorphism blur, or background particles.

- [ ] **Step 5: Run component test and build**

Run: `pnpm test -- src/components/App.test.tsx && pnpm build`  
Expected: all current tests pass and production build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles.css src/components
git commit -m "feat: build editorial dashboard shell"
```

## Task 6: Add preference scenarios and ranked route cards

**Files:**
- Modify: `src/components/ProfilePanel.tsx`
- Create: `src/components/RouteCard.tsx`
- Create: `src/components/RouteComparison.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/components/App.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

```tsx
// append inside src/components/App.test.tsx
it("re-ranks routes when the technical preset is selected", async () => {
  const user = userEvent.setup();
  render(<App />);
  const before = screen.getAllByTestId("route-card").map((card) => card.textContent);
  await user.click(screen.getByRole("button", { name: "最大化技术深度" }));
  const after = screen.getAllByTestId("route-card").map((card) => card.textContent);
  expect(after).not.toEqual(before);
  expect(screen.getByText(/权重后/)).toBeInTheDocument();
});

it("shows five component scores and keeps weights at one hundred percent", async () => {
  render(<App />);
  expect(screen.getAllByTestId("component-score")).toHaveLength(15);
  expect(screen.getByText("总权重 100%")).toBeInTheDocument();
});
```

Add `import userEvent from "@testing-library/user-event";`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test -- src/components/App.test.tsx`  
Expected: FAIL because scenario buttons and route cards do not exist.

- [ ] **Step 3: Implement route cards**

```tsx
// src/components/RouteCard.tsx
import type { ScoreKey, ScoredRoute } from "../domain/types";

const LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能",
  adjacency: "邻近",
  evidence: "证据",
  aiLeverage: "AI 杠杆",
  speed: "速度",
};

interface RouteCardProps {
  route: ScoredRoute;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}

export function RouteCard({ route, rank, selected, onSelect }: RouteCardProps) {
  return (
    <article className={`route-card${selected ? " is-selected" : ""}`} data-testid="route-card">
      <button type="button" className="route-card-button" onClick={onSelect}>
        <span className="route-rank">0{rank}</span>
        <span className="route-title">
          <strong>{route.label}</strong>
          <small>{route.estimatedMonths} 个月准备周期</small>
        </span>
        <span className="route-score">{route.overallScore}</span>
      </button>
      <div className="score-grid">
        {(Object.entries(route.componentScores) as [ScoreKey, number][]).map(([key, value]) => (
          <div key={key} data-testid="component-score">
            <span>{LABELS[key]}</span>
            <strong>{Math.round(value)}</strong>
          </div>
        ))}
      </div>
      <p className="change-reason">{route.changeReason}</p>
    </article>
  );
}
```

`RouteComparison.tsx` renders the sorted cards in a section labelled “路径比较”, provides selected-route state through props, and shows the selected route's strengths and gaps below the cards.

- [ ] **Step 4: Add presets, sliders, horizon, and ranking integration**

Use these exact `ProfilePanelProps` fields:

```ts
weights: Weights;
horizonMonths: number;
onWeightChange: (key: ScoreKey, value: number) => void;
onPreset: (preset: "fastest" | "technical" | "business") => void;
onReset: () => void;
onHorizonChange: (months: number) => void;
```

Replace `ProfilePanel.tsx` with:

```tsx
import type { CandidateProfile, ScoreKey, Weights } from "../domain/types";

const SCORE_LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能迁移",
  adjacency: "职业邻近",
  evidence: "证据强度",
  aiLeverage: "AI 杠杆",
  speed: "转型速度",
};

interface ProfilePanelProps {
  profile: CandidateProfile;
  weights: Weights;
  horizonMonths: number;
  onWeightChange: (key: ScoreKey, value: number) => void;
  onPreset: (preset: "fastest" | "technical" | "business") => void;
  onReset: () => void;
  onHorizonChange: (months: number) => void;
}

export function ProfilePanel({
  profile,
  weights,
  horizonMonths,
  onWeightChange,
  onPreset,
  onReset,
  onHorizonChange,
}: ProfilePanelProps) {
  return (
    <section className="profile-panel" aria-label="候选人画像与偏好" data-tour-target="profile">
      <p className="section-index">01 / PROFILE</p>
      <h2>{profile.name}</h2>
      <p className="profile-headline">{profile.headline}</p>
      <p>{profile.summary}</p>
      <div className="skill-cloud" aria-label="核心能力">
        {profile.skills.slice(0, 7).map((skill) => (
          <span key={skill.skillId}>{skill.skillId}</span>
        ))}
      </div>

      <div className="control-block">
        <div className="control-heading">
          <h3>转型时间</h3>
          <span>{horizonMonths} 个月</span>
        </div>
        <div className="segmented-control">
          {[3, 6, 12].map((months) => (
            <button
              key={months}
              type="button"
              aria-pressed={horizonMonths === months}
              onClick={() => onHorizonChange(months)}
            >
              {months} 个月
            </button>
          ))}
        </div>
      </div>

      <div className="control-block">
        <div className="control-heading">
          <h3>决策权重</h3>
          <span>总权重 100%</span>
        </div>
        {(Object.entries(weights) as [ScoreKey, number][]).map(([key, value]) => (
          <label className="weight-control" key={key}>
            <span>{SCORE_LABELS[key]}</span>
            <output>{Math.round(value * 100)}%</output>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={Math.round(value * 100)}
              aria-label={`${SCORE_LABELS[key]}权重`}
              onChange={(event) => onWeightChange(key, Number(event.target.value) / 100)}
            />
          </label>
        ))}
      </div>

      <div className="preset-grid" aria-label="情景预设">
        <button type="button" onClick={() => onPreset("fastest")}>最快进入 AI</button>
        <button type="button" onClick={() => onPreset("technical")}>最大化技术深度</button>
        <button type="button" onClick={() => onPreset("business")}>发挥商业优势</button>
        <button type="button" className="reset-button" onClick={onReset}>恢复推荐权重</button>
      </div>
    </section>
  );
}
```

Create:

```tsx
// src/components/RouteComparison.tsx
import type { ScoredRoute } from "../domain/types";
import { RouteCard } from "./RouteCard";

interface RouteComparisonProps {
  routes: ScoredRoute[];
  selectedRouteId: string;
  onSelectRoute: (routeId: string) => void;
}

export function RouteComparison({
  routes,
  selectedRouteId,
  onSelectRoute,
}: RouteComparisonProps) {
  const selected = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  return (
    <section className="route-panel" aria-label="路径比较" data-tour-target="routes">
      <div className="panel-heading">
        <div><p className="section-index">03 / ROUTES</p><h2>路径比较</h2></div>
        <p className="data-note">分数是决策辅助，不是录用概率</p>
      </div>
      <div className="route-list">
        {routes.map((route, index) => (
          <RouteCard
            key={route.id}
            route={route}
            rank={index + 1}
            selected={route.id === selected.id}
            onSelect={() => onSelectRoute(route.id)}
          />
        ))}
      </div>
      <div className="route-summary">
        <div>
          <span>可迁移优势</span>
          <ul>{selected.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <span>关键缺口</span>
          <ul>{selected.gaps.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
```

Replace `App.tsx` with:

```tsx
import { useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ProfilePanel } from "./components/ProfilePanel";
import { RouteComparison } from "./components/RouteComparison";
import { dataset } from "./data";
import { enrichRoutes, explainRankingChange } from "./domain/explanations";
import {
  DEFAULT_WEIGHTS,
  PRESET_WEIGHTS,
  rankRoutes,
  rebalanceWeights,
} from "./domain/scoring";
import type { ScoreKey, Weights } from "./domain/types";

export default function App() {
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [previousWeights, setPreviousWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [horizonMonths, setHorizonMonths] = useState(6);
  const [selectedRouteId, setSelectedRouteId] = useState(dataset.routes[0].id);
  const [tourRequested, setTourRequested] = useState(false);

  const routes = useMemo(() => {
    const before = new Map(
      enrichRoutes(dataset, rankRoutes(dataset, previousWeights, horizonMonths)).map((route) => [route.id, route]),
    );
    return enrichRoutes(dataset, rankRoutes(dataset, weights, horizonMonths)).map((route) => ({
      ...route,
      changeReason:
        weights === previousWeights
          ? "当前为推荐权重。"
          : explainRankingChange(before.get(route.id)!, route, previousWeights, weights),
    }));
  }, [weights, previousWeights, horizonMonths]);

  function commitWeights(next: Weights) {
    setPreviousWeights(weights);
    setWeights(next);
  }

  function selectPreset(name: keyof typeof PRESET_WEIGHTS) {
    commitWeights(PRESET_WEIGHTS[name]);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <AppHeader onStartTour={() => setTourRequested(true)} />
      <main id="main-content" className="workspace">
        <ProfilePanel
          profile={dataset.profile}
          weights={weights}
          horizonMonths={horizonMonths}
          onWeightChange={(key: ScoreKey, value: number) =>
            commitWeights(rebalanceWeights(weights, key, value))
          }
          onPreset={selectPreset}
          onReset={() => commitWeights(DEFAULT_WEIGHTS)}
          onHorizonChange={setHorizonMonths}
        />
        <section className="graph-panel" aria-label="职业跃迁图谱">
          <p className="section-index">02 / MAP</p>
          <h2>职业跃迁图谱</h2>
          <p>当前角色、桥接角色与目标角色形成可追溯路径。</p>
        </section>
        <RouteComparison
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
      </main>
      {tourRequested && (
        <div className="tour-request" role="status">
          讲解模式已准备；完整五步引导将在证据模块接入后启用。
          <button type="button" onClick={() => setTourRequested(false)}>关闭</button>
        </div>
      )}
    </div>
  );
}
```

Add exact control and route styles:

```css
.control-block {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.control-heading,
.panel-heading,
.route-card-button,
.weight-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.control-heading h3,
.control-heading span {
  margin: 0;
  font-size: 0.82rem;
}

.control-heading span,
.weight-control output,
.route-score {
  font-family: var(--mono);
}

.segmented-control,
.preset-grid {
  display: grid;
  gap: 7px;
  margin-top: 10px;
}

.segmented-control {
  grid-template-columns: repeat(3, 1fr);
}

.segmented-control button,
.preset-grid button {
  padding: 9px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  background: transparent;
  cursor: pointer;
}

.segmented-control button[aria-pressed="true"],
.preset-grid button:hover {
  color: white;
  background: var(--teal);
}

.weight-control {
  display: grid;
  grid-template-columns: 1fr auto;
  margin-top: 10px;
  font-size: 0.76rem;
}

.weight-control input {
  grid-column: 1 / -1;
  width: 100%;
  accent-color: var(--coral);
}

.route-list {
  display: grid;
  gap: 10px;
}

.route-card {
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.45);
  transition: transform 180ms ease, border-color 180ms ease;
}

.route-card.is-selected {
  border-color: var(--coral);
  transform: translateX(-4px);
}

.route-card-button {
  width: 100%;
  padding: 13px;
  border: 0;
  color: var(--ink);
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.route-rank {
  color: var(--coral);
  font-family: var(--mono);
}

.route-title {
  display: grid;
  flex: 1;
}

.route-title small {
  margin-top: 3px;
  color: rgba(16, 33, 38, 0.66);
}

.route-score {
  font-size: 1.7rem;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid var(--line);
}

.score-grid > div {
  display: grid;
  gap: 3px;
  padding: 9px 5px;
  text-align: center;
  border-right: 1px solid var(--line);
}

.score-grid > div:last-child {
  border-right: 0;
}

.score-grid span {
  font-size: 0.64rem;
}

.score-grid strong {
  font-family: var(--mono);
}

.change-reason {
  margin: 0;
  padding: 0 13px 12px;
  color: var(--teal);
  font-size: 0.75rem;
}

.route-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}

.route-summary > div {
  padding: 12px;
  background: var(--mist);
  border-radius: 12px;
}

.route-summary ul {
  margin: 8px 0 0;
  padding-left: 18px;
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test -- src/components/App.test.tsx src/domain`  
Expected: interaction and all domain tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles.css src/components
git commit -m "feat: add interactive career scenarios"
```

## Task 7: Add the accessible SVG career graph

**Files:**
- Create: `src/components/CareerGraph.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/components/App.test.tsx`

- [ ] **Step 1: Write a failing graph interaction test**

```tsx
// append inside src/components/App.test.tsx
it("filters the visible route context when a graph node is selected", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: /People Analytics 数据科学家/ }));
  expect(screen.getByRole("status")).toHaveTextContent(/已聚焦/);
  expect(screen.getByText(/再次点击或按 Esc/)).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByText(/再次点击或按 Esc/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test -- src/components/App.test.tsx`  
Expected: FAIL because graph node buttons are absent.

- [ ] **Step 3: Implement graph rendering**

```tsx
// src/components/CareerGraph.tsx
import type { Role, RouteDefinition, TransitionEdge } from "../domain/types";

interface CareerGraphProps {
  roles: Role[];
  transitions: TransitionEdge[];
  routes: RouteDefinition[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string | null) => void;
}

export function CareerGraph({
  roles,
  transitions,
  routes,
  selectedRoleId,
  onSelectRole,
}: CareerGraphProps) {
  const relatedRoleIds = selectedRoleId
    ? new Set(
        routes
          .filter((route) => route.roleIds.includes(selectedRoleId))
          .flatMap((route) => route.roleIds),
      )
    : new Set(roles.map((role) => role.id));

  const roleMap = new Map(roles.map((role) => [role.id, role]));

  return (
    <section className="graph-panel" aria-label="职业跃迁图谱">
      <div className="panel-heading">
        <div><p className="section-index">02 / MAP</p><h2>职业跃迁图谱</h2></div>
        <p className="data-note">策展图谱 · 非实时市场规模</p>
      </div>
      <div className="graph-wrap">
        <svg viewBox="0 0 720 560" role="img" aria-label="从当前角色到桥接和目标角色的职业路径">
          <g className="graph-edges">
            {transitions.map((edge) => {
              const source = roleMap.get(edge.sourceRoleId)!;
              const target = roleMap.get(edge.targetRoleId)!;
              const active = relatedRoleIds.has(source.id) && relatedRoleIds.has(target.id);
              return (
                <line
                  key={`${source.id}-${target.id}`}
                  x1={source.position.x}
                  y1={source.position.y}
                  x2={target.position.x}
                  y2={target.position.y}
                  className={active ? "is-active" : "is-muted"}
                />
              );
            })}
          </g>
          {roles.map((role) => {
            const active = relatedRoleIds.has(role.id);
            return (
              <g
                key={role.id}
                className={`graph-node stage-${role.stage}${active ? " is-active" : " is-muted"}`}
                transform={`translate(${role.position.x} ${role.position.y})`}
              >
                <circle r={role.stage === "target" ? 29 : 23} />
                <foreignObject x="-68" y="34" width="136" height="52">
                  <button type="button" onClick={() => onSelectRole(selectedRoleId === role.id ? null : role.id)}>
                    {role.title}
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="graph-legend" aria-hidden="true">
        <span className="current">当前</span><span className="bridge">桥接</span><span className="target">目标</span>
      </div>
      {selectedRoleId && (
        <p role="status" className="focus-status">
          已聚焦 {roleMap.get(selectedRoleId)?.title}。再次点击或按 Esc 恢复全图。
        </p>
      )}
    </section>
  );
}
```

In `App.tsx`, add `selectedRoleId`, a document keydown listener for Escape, and pass data to `CareerGraph`. Route cards unrelated to the selected node receive the muted class but remain readable and keyboard accessible.

- [ ] **Step 4: Style graph states without color-only meaning**

Use circle size, border pattern, text label, line opacity, and `stroke-dasharray` in addition to teal/coral/amber colors. Ensure button focus states remain visible inside SVG `foreignObject`.

- [ ] **Step 5: Run tests and build**

Run: `pnpm test && pnpm build`  
Expected: all tests pass and build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles.css src/components/CareerGraph.tsx src/components/App.test.tsx
git commit -m "feat: add interactive career graph"
```

## Task 8: Add evidence drawer, model boundary, and interview tour

**Files:**
- Create: `src/components/DetailDrawer.tsx`
- Create: `src/components/LiveAiDialog.tsx`
- Create: `src/components/TourOverlay.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/components/App.test.tsx`

- [ ] **Step 1: Write failing drawer and tour tests**

```tsx
// append inside src/components/App.test.tsx
it("opens a route drawer with evidence, scoring, plan, and model tabs", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getAllByRole("button", { name: /查看完整依据/ })[0]);
  expect(screen.getByRole("dialog", { name: /路径决策依据/ })).toBeInTheDocument();
  for (const tab of ["证据", "评分", "行动计划", "模型说明"]) {
    expect(screen.getByRole("tab", { name: tab })).toBeInTheDocument();
  }
  await user.click(screen.getByRole("tab", { name: "行动计划" }));
  expect(screen.getByText("0–30 天")).toBeInTheDocument();
  expect(screen.getByText("61–90 天")).toBeInTheDocument();
});

it("runs and exits the five-step interview tour", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole("button", { name: "开始三分钟讲解" }));
  expect(screen.getByText("1 / 5")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "下一步" }));
  expect(screen.getByText("2 / 5")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "退出讲解" }));
  expect(screen.queryByText("2 / 5")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/components/App.test.tsx`  
Expected: FAIL because drawer, tabs, and tour are missing.

- [ ] **Step 3: Implement the detail drawer**

Add `onOpenDetails: () => void` to `RouteCardProps` and append this sibling after `.change-reason`:

```tsx
<button className="details-button" type="button" onClick={onOpenDetails}>
  查看完整依据
</button>
```

Add `onOpenDetails: (routeId: string) => void` to `RouteComparisonProps` and pass `onOpenDetails={() => onOpenDetails(route.id)}` to every `RouteCard`.

Create:

```tsx
// src/components/DetailDrawer.tsx
import { useEffect, useState } from "react";
import { buildNinetyDayPlan } from "../domain/planning";
import type {
  CandidateProfile,
  ScoreKey,
  ScoredRoute,
  Skill,
  Weights,
} from "../domain/types";

type DrawerTab = "evidence" | "score" | "plan" | "model";

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "evidence", label: "证据" },
  { id: "score", label: "评分" },
  { id: "plan", label: "行动计划" },
  { id: "model", label: "模型说明" },
];

const SCORE_LABELS: Record<ScoreKey, string> = {
  skillTransfer: "技能迁移度",
  adjacency: "职业邻近度",
  evidence: "证据强度",
  aiLeverage: "AI 杠杆价值",
  speed: "转型速度",
};

interface DetailDrawerProps {
  route: ScoredRoute;
  profile: CandidateProfile;
  skills: Skill[];
  weights: Weights;
  onClose: () => void;
}

export function DetailDrawer({
  route,
  profile,
  skills,
  weights,
  onClose,
}: DetailDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("evidence");
  const evidence = profile.evidence.filter((item) => route.evidenceIds.includes(item.id));
  const plan = buildNinetyDayPlan(route, skills);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        data-tour-target="drawer"
      >
        <header>
          <div>
            <p className="section-index">DECISION TRACE</p>
            <h2 id="drawer-title">{route.label} · 路径决策依据</h2>
          </div>
          <button type="button" aria-label="关闭路径决策依据" onClick={onClose}>×</button>
        </header>
        <div className="drawer-tabs" role="tablist" aria-label="决策依据分类">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "evidence" && (
          <div className="drawer-content">
            <p className="drawer-lead">推荐不是从岗位关键词开始，而是从可核验经历开始。</p>
            {evidence.map((item) => (
              <article className="evidence-card" key={item.id}>
                <span>来源：简历证据 · 强度 {Math.round(item.strength * 100)}</span>
                <h3>{item.label}</h3>
                <p>{item.excerpt}</p>
              </article>
            ))}
          </div>
        )}

        {tab === "score" && (
          <div className="drawer-content">
            <p className="formula">
              总分 = Σ（组件分 × 当前权重）= <strong>{route.overallScore}</strong>
            </p>
            {(Object.entries(route.componentScores) as [ScoreKey, number][]).map(([key, value]) => (
              <div className="formula-row" key={key}>
                <span>{SCORE_LABELS[key]}</span>
                <span>{Math.round(value)} × {Math.round(weights[key] * 100)}%</span>
              </div>
            ))}
            <p className="notice">这是策展图谱上的决策辅助分，不是录用概率或因果效应。</p>
          </div>
        )}

        {tab === "plan" && (
          <div className="drawer-content plan-grid">
            {plan.map((phase) => (
              <article key={phase.range}>
                <span>{phase.range}</span>
                <h3>{phase.label}</h3>
                {phase.actions.map((action) => (
                  <div key={action.title}>
                    <strong>{action.title}</strong>
                    <p>{action.deliverable}</p>
                    <small>证据目标：{action.evidenceGoal}</small>
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}

        {tab === "model" && (
          <div className="drawer-content model-boundary">
            <article><span>01</span><div><h3>本地图谱</h3><p>定义角色、技能和可解释转移边。</p></div></article>
            <article><span>02</span><div><h3>确定性评分</h3><p>相同输入与权重始终产生相同结果。</p></div></article>
            <article><span>03</span><div><h3>可选 Live AI</h3><p>只做结构化和表达；AI 不能修改底层分数。</p></div></article>
          </div>
        )}
      </aside>
    </div>
  );
}
```

When opening the drawer in `App.tsx`, store the focused button as `document.activeElement as HTMLElement`; on close, set the drawer route to `null` and call `.focus()` on that saved element. This gives close-button, backdrop, and Escape paths the same focus-restoration behavior.

- [ ] **Step 4: Implement Live AI status and tour**

```tsx
// src/components/LiveAiDialog.tsx
interface LiveAiDialogProps {
  configured: boolean;
  onClose: () => void;
}

export function LiveAiDialog({ configured, onClose }: LiveAiDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="live-ai-title" className="mode-dialog">
        <p className="section-index">MODEL BOUNDARY</p>
        <h2 id="live-ai-title">Live AI {configured ? "已配置" : "未配置"}</h2>
        <p>稳定演示不依赖模型。Live AI 只负责自由文本结构化和语言表达，不能改写底层分数。</p>
        <p className="notice">浏览器不保存密钥；服务端端点缺失时开关保持禁用。</p>
        <button type="button" onClick={onClose}>我明白了</button>
      </section>
    </div>
  );
}
```

`TourOverlay.tsx` owns an index from 0–4 and uses this immutable step data:

```ts
const STEPS = [
  { title: "传统匹配分隐藏了什么？", body: "先看证据，而不是先相信分数。", target: "profile" },
  { title: "把经历转成带证据的能力", body: "每项能力都可回到具体研究或业务经历。", target: "profile" },
  { title: "桥接岗位比终点更重要", body: "职业图谱显示可行的中间台阶。", target: "graph" },
  { title: "推荐会随目标变化", body: "调整权重，排序和解释同步变化。", target: "routes" },
  { title: "把结论变成 90 天证据", body: "行动计划明确交付物与验证标准。", target: "drawer" }
] as const;
```

Render current step, `N / 5`, previous, next/finish, and exit controls. `App.tsx` toggles `data-tour-target` attributes to highlight the relevant region.

- [ ] **Step 5: Run tests**

Run: `pnpm test -- src/components/App.test.tsx`  
Expected: drawer and tour tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/styles.css src/components
git commit -m "feat: add evidence drawer and interview tour"
```

## Task 9: Add automated E2E, accessibility, and responsive verification

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/demo.spec.ts`
- Modify: `src/components/App.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add Playwright configuration**

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "compact", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } } },
  ],
});
```

- [ ] **Step 2: Write the failing three-minute E2E workflow**

```ts
// e2e/demo.spec.ts
import { expect, test } from "@playwright/test";

test("completes the offline career decision workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /CareerGraph AI/ })).toBeVisible();
  await expect(page.getByText("稳定演示")).toBeVisible();

  const firstBefore = await page.getByTestId("route-card").first().innerText();
  await page.getByRole("button", { name: "最大化技术深度" }).click();
  const firstAfter = await page.getByTestId("route-card").first().innerText();
  expect(firstAfter).not.toBe(firstBefore);

  await page.getByRole("button", { name: /People Analytics 数据科学家/ }).click();
  await expect(page.getByRole("status")).toContainText("已聚焦");

  await page.getByRole("button", { name: /查看完整依据/ }).first().click();
  await page.getByRole("tab", { name: "行动计划" }).click();
  await expect(page.getByText("61–90 天")).toBeVisible();
  await page.getByRole("tab", { name: "模型说明" }).click();
  await expect(page.getByText(/AI 不能修改.*分数/)).toBeVisible();
});

test("completes the five-step interview tour", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始三分钟讲解" }).click();
  for (let step = 1; step < 5; step += 1) {
    await expect(page.getByText(`${step} / 5`)).toBeVisible();
    await page.getByRole("button", { name: "下一步" }).click();
  }
  await expect(page.getByText("5 / 5")).toBeVisible();
  await page.getByRole("button", { name: "完成讲解" }).click();
  await expect(page.getByText("5 / 5")).not.toBeVisible();
});
```

- [ ] **Step 3: Run E2E to verify failures reveal missing polish**

Run: `pnpm test:e2e`  
Expected: any failures identify exact accessible-name, layout, or flow gaps; do not weaken assertions to hide product defects.

- [ ] **Step 4: Fix keyboard and responsive defects**

Add or verify:

- skip link to `<main id="main-content">`;
- Escape handling for graph focus, drawer, dialog, and tour;
- body scroll lock only while a modal is open;
- focus restoration for closed overlays;
- text labels in addition to color and animation;
- no horizontal page overflow at 1024×768;
- route scores do not clip at 200% browser text zoom;
- graph retains accessible node buttons at both viewports.

Add a component test that tabs from the skip link into the main content and a test that Escape closes the currently open overlay.

- [ ] **Step 5: Run the complete automated suite**

Run: `pnpm test && pnpm build && pnpm test:e2e`  
Expected: all unit/component/E2E tests pass for both desktop and compact projects; `dist/` is produced.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts e2e src
git commit -m "test: cover the complete interview workflow"
```

## Task 10: Create the portfolio handoff and perform final visual verification

**Files:**
- Create: `README.md`
- Create: `docs/interview-demo.md`
- Modify: `package.json` only if verification reveals a script defect.

- [ ] **Step 1: Write the README**

Include:

```markdown
# CareerGraph AI

CareerGraph AI is an offline-first, explainable career-transition lab. It compares three AI-career routes with an auditable graph, deterministic scoring, evidence links, scenario controls, and a 90-day action plan.

## Run locally

```bash
pnpm install
pnpm dev
```

## Verify

```bash
pnpm test
pnpm build
pnpm test:e2e
```

## What is AI here?

- Curated career graph and deterministic scoring remain the decision source of truth.
- Live AI is an optional, schema-gated adapter for free-text structure and language.
- The model cannot alter scores or invent resume evidence.
- The app works fully offline without a model key.

## Data limits

The included graph is a curated portfolio dataset, not a live labor-market forecast. Contact details are excluded from the demo profile.
```

Add architecture, folder map, scenario-weight table, failure behavior, privacy, and screenshot sections.

- [ ] **Step 2: Write the interview script**

`docs/interview-demo.md` must include:

- a 20-second opening;
- a 150-second click-by-click demo;
- a 10-second close;
- answers to “为什么不用纯 LLM”, “分数是否科学”, “如何接入真实数据”, “如何评估”, “下一版做什么”, and “你本人贡献是什么”;
- separate framing for AI Product Manager, Data Scientist, and AI Solutions interviews;
- explicit language that the graph is curated and the score is a decision aid, not causal evidence.

- [ ] **Step 3: Run production verification**

Run: `pnpm test && pnpm build && pnpm test:e2e`  
Expected: every automated check passes from a clean working tree except uncommitted README/script changes.

- [ ] **Step 4: Start the production preview and inspect every required state**

Run: `pnpm preview --host 127.0.0.1 --port 4173`  
Inspect in a real browser at 1440×900 and 1024×768:

1. default dashboard;
2. fastest preset;
3. technical preset;
4. business preset;
5. focused graph node;
6. each detail-drawer tab;
7. Live AI explanation dialog;
8. all five tour steps.

Capture screenshots to `artifacts/visual-qa/` for internal verification. Check clipping, overlap, unreadable labels, horizontal overflow, weak contrast, broken focus, and misleading claims. Fix defects, repeat automated tests, and reinspect changed states.

- [ ] **Step 5: Audit the design acceptance criteria**

Use the ten acceptance criteria in `docs/superpowers/specs/2026-07-29-careergraph-ai-design.md`. Record evidence for each criterion in `docs/verification.md`, including commands, passing test counts, browser states inspected, and any deliberate scope limitation.

- [ ] **Step 6: Commit the handoff**

```bash
git add README.md docs package.json artifacts/visual-qa
git commit -m "docs: add interview demo and verification evidence"
```

- [ ] **Step 7: Prepare deployment**

Confirm no `.env`, token, phone number, or email appears in tracked files:

```bash
git grep -n -E 'OPENAI_API_KEY|18858493027|bixyw54@nottingham\\.edu\\.cn'
```

Expected: no output.

Use the Sites building and hosting workflows to package the exact verified source commit, save a version, deploy it, and inspect the deployment status. Verify the production URL repeats the core offline flow before final handoff.
