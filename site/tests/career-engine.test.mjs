import assert from "node:assert/strict";
import test from "node:test";

import { dataset } from "../app/lib/career-data.ts";
import {
  DEFAULT_WEIGHTS,
  PRESET_WEIGHTS,
  analyzeProfileWithFallback,
  buildNinetyDayPlan,
  enrichRoutes,
  explainScenario,
  normalizeWeights,
  rankRoutes,
  rebalanceWeights,
  validateDataset,
  validateLiveAiProfile,
} from "../app/lib/career-engine.ts";

test("the curated dataset has no dangling roles, skills, evidence, edges, or routes", () => {
  assert.deepEqual(validateDataset(dataset), []);
});

test("weights normalize and rebalance to exactly one", () => {
  const normalized = normalizeWeights({
    skillTransfer: 30,
    adjacency: 20,
    evidence: 20,
    aiLeverage: 20,
    speed: 10,
  });
  assert.ok(Math.abs(Object.values(normalized).reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
  assert.equal(normalized.skillTransfer, 0.3);

  const rebalanced = rebalanceWeights(DEFAULT_WEIGHTS, "speed", 0.3);
  assert.ok(Math.abs(Object.values(rebalanced).reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
  assert.equal(rebalanced.speed, 0.3);
});

test("route scoring is deterministic, bounded, and reacts to scenarios", () => {
  const first = rankRoutes(dataset, DEFAULT_WEIGHTS, 6);
  const second = rankRoutes(dataset, DEFAULT_WEIGHTS, 6);
  assert.deepEqual(first, second);

  for (const route of first) {
    assert.ok(route.overallScore >= 0 && route.overallScore <= 100);
    for (const value of Object.values(route.componentScores)) {
      assert.ok(value >= 0 && value <= 100);
    }
  }

  const technicalOrder = rankRoutes(dataset, PRESET_WEIGHTS.technical, 6).map((route) => route.id);
  const businessOrder = rankRoutes(dataset, PRESET_WEIGHTS.business, 6).map((route) => route.id);
  assert.notDeepEqual(technicalOrder, businessOrder);
});

test("speed reflects target preparation time and the candidate's real skill gaps", () => {
  const baseline = rankRoutes(dataset, DEFAULT_WEIGHTS, 6).find(
    (route) => route.id === "route-ai-product",
  );

  const slowerTarget = structuredClone(dataset);
  const productRole = slowerTarget.roles.find(
    (role) => role.id === "target-ai-product-manager",
  );
  productRole.typicalPrepMonths += 6;
  const slower = rankRoutes(slowerTarget, DEFAULT_WEIGHTS, 6).find(
    (route) => route.id === "route-ai-product",
  );

  const gapHeavy = structuredClone(dataset);
  const targetSkillIds = new Set(productRole.requiredSkills.map((item) => item.skillId));
  gapHeavy.profile.skills = gapHeavy.profile.skills.map((skill) =>
    targetSkillIds.has(skill.skillId)
      ? { ...skill, confidence: 0 }
      : skill,
  );
  const gapHeavyRoute = rankRoutes(gapHeavy, DEFAULT_WEIGHTS, 6).find(
    (route) => route.id === "route-ai-product",
  );

  assert.ok(slower.componentScores.speed < baseline.componentScores.speed);
  assert.ok(gapHeavyRoute.componentScores.speed < baseline.componentScores.speed);
});

test("scenario explanations identify the dominant weight change and rank movement", () => {
  const baseline = rankRoutes(dataset, DEFAULT_WEIGHTS, 6);
  const technical = rankRoutes(dataset, PRESET_WEIGHTS.technical, 6);
  const route = technical.find((item) => item.id === "route-ai-solutions");
  const previous = baseline.find((item) => item.id === route.id);

  const explanation = explainScenario(
    route,
    previous,
    "最大化技术深度",
    PRESET_WEIGHTS.technical,
    DEFAULT_WEIGHTS,
    technical.indexOf(route) + 1,
    baseline.indexOf(previous) + 1,
  );

  assert.match(explanation, /AI 杠杆权重/);
  assert.match(explanation, /第 2 → 第 3/);
});

test("every recommendation is enriched with strengths, gaps, and resume evidence", () => {
  const routes = enrichRoutes(dataset, rankRoutes(dataset, DEFAULT_WEIGHTS, 6));
  for (const route of routes) {
    assert.ok(route.strengths.length >= 2);
    assert.ok(route.gaps.length >= 1);
    assert.ok(route.evidenceIds.length >= 1);
  }
});

test("the action plan has three ordered phases and concrete evidence goals", () => {
  const plan = buildNinetyDayPlan(dataset.routes[0], dataset.skills);
  assert.deepEqual(
    plan.map((phase) => phase.range),
    ["0–30 天", "31–60 天", "61–90 天"],
  );
  assert.ok(plan.every((phase) => phase.actions.every((action) => action.evidenceGoal.length > 0)));
});

test("Live AI responses are schema-gated and failures preserve the original text", async () => {
  assert.equal(validateLiveAiProfile({ headline: "", skills: "many" }).ok, false);
  assert.equal(
    validateLiveAiProfile({
      headline: "人才数据研究者",
      summary: "",
      skills: [],
    }).ok,
    false,
  );
  assert.equal(
    validateLiveAiProfile({
      headline: "人才数据研究者",
      summary: "研究职业流动与 AI 转型。",
      skills: [{ name: "未知技能", confidence: 0, evidence: "模型猜测" }],
    }).ok,
    false,
  );
  assert.equal(
    validateLiveAiProfile({
      headline: "人才数据研究者",
      summary: "研究职业流动与 AI 转型。",
      skills: [{ name: "因果推断", confidence: 0.9, evidence: "DID 与事件研究" }],
    }).ok,
    true,
  );

  const result = await analyzeProfileWithFallback("我的经历", {
    async analyze() {
      throw new Error("timeout");
    },
  });

  assert.equal(result.mode, "stable");
  assert.equal(result.originalText, "我的经历");
  assert.match(result.notice, /已回退到稳定演示模式/);
});
