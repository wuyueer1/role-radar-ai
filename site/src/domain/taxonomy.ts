import type { RoleFamily } from "./types";

interface SkillDefinition {
  id: string;
  aliases: string[];
}

const skillDefinitions: SkillDefinition[] = [
  { id: "data-analysis", aliases: ["data analysis", "data analytics", "数据分析", "数据洞察"] },
  { id: "machine-learning", aliases: ["machine learning", "机器学习", "ml model"] },
  { id: "nlp-embeddings", aliases: ["natural language processing", "nlp", "text embedding", "文本嵌入", "自然语言处理"] },
  { id: "llm", aliases: ["large language model", "llm", "大语言模型", "生成式 ai", "generative ai"] },
  { id: "rag", aliases: ["retrieval augmented generation", "rag", "检索增强生成"] },
  { id: "vector-databases", aliases: ["vector database", "vector databases", "vector db", "向量数据库"] },
  { id: "prompt-engineering", aliases: ["prompt engineering", "prompt design", "提示词工程", "提示工程"] },
  { id: "graph-analytics", aliases: ["graph analytics", "graph network", "knowledge graph", "图网络", "知识图谱"] },
  { id: "causal-inference", aliases: ["causal inference", "difference in differences", "did", "因果推断", "双重差分"] },
  { id: "experiment-design", aliases: ["experiment design", "a/b test", "ab test", "实验设计", "实验分析"] },
  { id: "data-visualization", aliases: ["data visualization", "dashboard", "数据可视化", "数据看板"] },
  { id: "product-discovery", aliases: ["product discovery", "产品发现", "需求发现", "problem discovery"] },
  { id: "user-research", aliases: ["user research", "ux research", "用户研究", "用户访谈"] },
  { id: "stakeholder-management", aliases: ["stakeholder management", "cross-functional", "利益相关者", "跨部门协作"] },
  { id: "business-analysis", aliases: ["business analysis", "business analytics", "商业分析", "业务分析"] },
  { id: "solution-design", aliases: ["solution design", "solution architecture", "解决方案设计", "方案设计"] },
  { id: "api-integration", aliases: ["api integration", "rest api", "api 集成", "接口集成"] },
  { id: "frontend-engineering", aliases: ["frontend engineering", "front-end", "react", "前端工程", "前端开发"] },
  { id: "mlops", aliases: ["mlops", "model deployment", "模型部署", "模型监控"] },
  { id: "responsible-ai", aliases: ["responsible ai", "ai safety", "ai governance", "负责任 ai", "ai 治理", "人工智能安全"] },
  { id: "python", aliases: ["python"] },
  { id: "sql", aliases: ["sql"] },
  { id: "cloud", aliases: ["cloud computing", "aws", "azure", "gcp", "云计算", "云平台"] },
];

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesAlias = (text: string, alias: string): boolean => {
  const normalizedAlias = alias.normalize("NFKC").toLocaleLowerCase("en");
  if (/^[a-z0-9][a-z0-9 +./-]*$/i.test(normalizedAlias)) {
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalizedAlias)}(?:$|[^a-z0-9])`, "i").test(text);
  }
  return text.includes(normalizedAlias);
};

export function extractSkills(value: string): string[] {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("en");
  return skillDefinitions
    .filter((definition) => definition.aliases.some((alias) => includesAlias(normalized, alias)))
    .map((definition) => definition.id);
}

const roleRules: Array<{
  family: Exclude<RoleFamily, "other">;
  titlePatterns: RegExp[];
  skillSignals: string[];
}> = [
  {
    family: "people-analytics",
    titlePatterns: [/people analytics/i, /talent intelligence/i, /workforce analytics/i, /人才(数据|智能|分析)/, /人力资源分析/],
    skillSignals: ["causal-inference", "experiment-design", "stakeholder-management"],
  },
  {
    family: "ai-product",
    titlePatterns: [/\bai product\b/i, /product manager.*ai/i, /ai.*product manager/i, /ai 产品/, /人工智能产品/, /产品经理/],
    skillSignals: ["product-discovery", "user-research", "llm", "responsible-ai"],
  },
  {
    family: "ai-solutions",
    titlePatterns: [/ai solutions?/i, /solutions? architect/i, /ai consultant/i, /解决方案/, /ai 咨询/, /人工智能顾问/],
    skillSignals: ["solution-design", "stakeholder-management", "api-integration", "business-analysis"],
  },
  {
    family: "ai-engineering",
    titlePatterns: [
      /ai engineer/i,
      /machine learning engineer/i,
      /ml engineer/i,
      /llm engineer/i,
      /(?:engineering manager|engineer).*\binference\b/i,
      /\binference\b.*(?:engineering manager|engineer)/i,
      /research engineer.*(?:machine learning|\bai\b|model|alignment)/i,
      /(?:machine learning|\bai\b|model|alignment).*research engineer/i,
      /ai 工程师/,
      /算法工程师/,
      /机器学习工程师/,
    ],
    skillSignals: ["rag", "vector-databases", "api-integration", "mlops", "cloud", "frontend-engineering"],
  },
  {
    family: "data-science",
    titlePatterns: [/data scientist/i, /applied scientist/i, /research scientist/i, /数据科学/, /数据分析师/, /应用科学家/],
    skillSignals: ["data-analysis", "machine-learning", "python", "sql", "causal-inference"],
  },
];

export function classifyRoleFamily(title: string, skills: string[]): RoleFamily {
  const normalizedTitle = title.normalize("NFKC");
  const skillSet = new Set(skills);
  let best: { family: RoleFamily; score: number } = { family: "other", score: 0 };

  for (const rule of roleRules) {
    const titleScore = rule.titlePatterns.some((pattern) => pattern.test(normalizedTitle)) ? 3 : 0;
    if (titleScore === 0) continue;
    const skillScore = rule.skillSignals.filter((skill) => skillSet.has(skill)).length;
    const score = titleScore + skillScore;
    if (score > best.score) best = { family: rule.family, score };
  }

  return best.family;
}

export interface NormalizedLocation {
  original: string;
  normalized: string;
  marketScope: "default" | "global";
}

export function normalizeLocation(value: string): NormalizedLocation {
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  const defaultMarket =
    /(china|中国|mainland|北京|上海|深圳|广州|杭州|成都|香港|hong kong|新加坡|singapore)/i.test(
      normalized,
    ) ||
    /(?:remote|远程).*(?:asia|apac|亚洲|亚太)|(?:asia|apac|亚洲|亚太).*(?:remote|远程)/i.test(
      normalized,
    );

  return {
    original: value,
    normalized,
    marketScope: defaultMarket ? "default" : "global",
  };
}
