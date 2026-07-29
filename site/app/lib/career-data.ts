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
  shortName: string;
  category: "ai-data" | "research" | "product" | "business" | "engineering";
}

export interface Role {
  id: string;
  title: string;
  family: string;
  stage: "current" | "bridge" | "target";
  requiredSkills: { skillId: string; weight: number }[];
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

export interface RouteDefinition {
  id: string;
  label: string;
  roleIds: string[];
  estimatedMonths: number;
  actionSeeds: {
    gapSkillId: string;
    deliverable: string;
    evidenceGoal: string;
  }[];
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

const skills: Skill[] = [
  { id: "data-analysis", name: "数据分析", shortName: "数据分析", category: "ai-data" },
  { id: "machine-learning", name: "机器学习", shortName: "机器学习", category: "ai-data" },
  { id: "nlp-embeddings", name: "NLP / 文本嵌入", shortName: "NLP", category: "ai-data" },
  { id: "graph-analytics", name: "图网络分析", shortName: "图网络", category: "ai-data" },
  { id: "causal-inference", name: "因果推断", shortName: "因果推断", category: "research" },
  { id: "experiment-design", name: "实验设计", shortName: "实验设计", category: "research" },
  { id: "data-visualization", name: "数据可视化", shortName: "可视化", category: "ai-data" },
  { id: "product-discovery", name: "产品发现", shortName: "产品发现", category: "product" },
  { id: "ux-research", name: "用户研究", shortName: "用户研究", category: "product" },
  { id: "stakeholder-management", name: "利益相关者管理", shortName: "协作沟通", category: "business" },
  { id: "business-analysis", name: "商业分析", shortName: "商业分析", category: "business" },
  { id: "solution-design", name: "解决方案设计", shortName: "方案设计", category: "business" },
  { id: "api-integration", name: "API 集成", shortName: "API", category: "engineering" },
  { id: "frontend-engineering", name: "前端工程", shortName: "前端工程", category: "engineering" },
  { id: "mlops", name: "MLOps", shortName: "MLOps", category: "engineering" },
  { id: "responsible-ai", name: "负责任 AI", shortName: "AI 治理", category: "research" },
];

const profile: CandidateProfile = {
  id: "profile-yueer-w",
  name: "Yueer W.",
  headline: "信息系统博士 · 职业与人才数据研究者",
  summary: "把职业网络、文本嵌入与因果推断转化为可解释的人才决策产品。",
  evidence: [
    {
      id: "ev-career-network",
      label: "大规模职业网络研究",
      excerpt: "基于 48 万余名劳动者纵向履历构建劳动力市场网络与个性化加权 PageRank。",
      sourceType: "resume",
      strength: 0.98,
      skillIds: ["data-analysis", "graph-analytics", "data-visualization"],
    },
    {
      id: "ev-nlp",
      label: "岗位文本归一化",
      excerpt: "使用 all-MiniLM-L6-v2 与 BGE-M3 完成岗位名称归一化及 SOC 映射。",
      sourceType: "resume",
      strength: 0.95,
      skillIds: ["nlp-embeddings", "machine-learning", "data-analysis"],
    },
    {
      id: "ev-causal",
      label: "因果识别",
      excerpt: "使用 CEM、DID、固定效应、事件研究和安慰剂检验识别职业回报。",
      sourceType: "resume",
      strength: 0.96,
      skillIds: ["causal-inference", "experiment-design"],
    },
    {
      id: "ev-supply-chain",
      label: "供应链金融图谱",
      excerpt: "参与企业画像、异构网络、风险传导与 FICO 风格信用评分方案。",
      sourceType: "resume",
      strength: 0.9,
      skillIds: ["graph-analytics", "data-analysis", "business-analysis", "solution-design"],
    },
    {
      id: "ev-recruitment",
      label: "招聘漏斗优化",
      excerpt: "识别 20 项流程效率提升点，推动 Offer 转化率提升 5%。",
      sourceType: "resume",
      strength: 0.88,
      skillIds: ["data-analysis", "business-analysis", "stakeholder-management", "experiment-design"],
    },
    {
      id: "ev-consulting",
      label: "行业与战略咨询",
      excerpt: "完成医药行业和企业扩张研究，将分析转化为咨询建议。",
      sourceType: "resume",
      strength: 0.82,
      skillIds: ["business-analysis", "solution-design", "stakeholder-management"],
    },
    {
      id: "ev-teaching",
      label: "商业分析与机器学习教学",
      excerpt: "辅导数据分析、商业编程与机器学习课程，最高评教 96.3%。",
      sourceType: "resume",
      strength: 0.9,
      skillIds: ["machine-learning", "stakeholder-management", "data-visualization"],
    },
    {
      id: "ev-ai-boundary",
      label: "AI 分类与人工复核",
      excerpt: "采用大语言模型辅助编码、人工复核与专家验证构建职业分类。",
      sourceType: "resume",
      strength: 0.76,
      skillIds: ["responsible-ai", "product-discovery", "ux-research"],
    },
  ],
  skills: [
    { skillId: "data-analysis", confidence: 0.96, evidenceIds: ["ev-career-network", "ev-nlp", "ev-supply-chain", "ev-recruitment"] },
    { skillId: "machine-learning", confidence: 0.82, evidenceIds: ["ev-nlp", "ev-teaching"] },
    { skillId: "nlp-embeddings", confidence: 0.9, evidenceIds: ["ev-nlp"] },
    { skillId: "graph-analytics", confidence: 0.92, evidenceIds: ["ev-career-network", "ev-supply-chain"] },
    { skillId: "causal-inference", confidence: 0.95, evidenceIds: ["ev-causal"] },
    { skillId: "experiment-design", confidence: 0.88, evidenceIds: ["ev-causal", "ev-recruitment"] },
    { skillId: "data-visualization", confidence: 0.85, evidenceIds: ["ev-career-network", "ev-teaching"] },
    { skillId: "product-discovery", confidence: 0.58, evidenceIds: ["ev-ai-boundary"] },
    { skillId: "ux-research", confidence: 0.5, evidenceIds: ["ev-ai-boundary"] },
    { skillId: "stakeholder-management", confidence: 0.84, evidenceIds: ["ev-recruitment", "ev-consulting", "ev-teaching"] },
    { skillId: "business-analysis", confidence: 0.9, evidenceIds: ["ev-supply-chain", "ev-recruitment", "ev-consulting"] },
    { skillId: "solution-design", confidence: 0.66, evidenceIds: ["ev-supply-chain", "ev-consulting"] },
    { skillId: "api-integration", confidence: 0.28, evidenceIds: [] },
    { skillId: "frontend-engineering", confidence: 0.18, evidenceIds: [] },
    { skillId: "mlops", confidence: 0.2, evidenceIds: [] },
    { skillId: "responsible-ai", confidence: 0.76, evidenceIds: ["ev-ai-boundary"] },
  ],
  experienceSignals: [
    "48 万至 95 万劳动者纵向履历研究",
    "岗位文本嵌入与 SOC 映射",
    "职业网络与 PageRank",
    "CEM、DID 与事件研究",
    "招聘漏斗与供应链金融产业项目",
  ],
};

const roles: Role[] = [
  {
    id: "current-is-researcher",
    title: "信息系统研究者",
    family: "research",
    stage: "current",
    requiredSkills: [
      { skillId: "causal-inference", weight: 0.3 },
      { skillId: "data-analysis", weight: 0.25 },
      { skillId: "graph-analytics", weight: 0.2 },
      { skillId: "nlp-embeddings", weight: 0.15 },
      { skillId: "experiment-design", weight: 0.1 },
    ],
    aiLeverage: 72,
    typicalPrepMonths: 0,
    description: "研究 AI 与大数据背景下的职业流动和人才决策。",
    position: { x: 12, y: 15 },
  },
  {
    id: "current-talent-analyst",
    title: "人才数据分析师",
    family: "analytics",
    stage: "current",
    requiredSkills: [
      { skillId: "data-analysis", weight: 0.35 },
      { skillId: "business-analysis", weight: 0.25 },
      { skillId: "data-visualization", weight: 0.2 },
      { skillId: "stakeholder-management", weight: 0.2 },
    ],
    aiLeverage: 58,
    typicalPrepMonths: 0,
    description: "用人才与运营数据识别流程问题并推动决策。",
    position: { x: 12, y: 50 },
  },
  {
    id: "current-business-analyst",
    title: "商业分析师",
    family: "business",
    stage: "current",
    requiredSkills: [
      { skillId: "business-analysis", weight: 0.35 },
      { skillId: "stakeholder-management", weight: 0.3 },
      { skillId: "data-analysis", weight: 0.2 },
      { skillId: "solution-design", weight: 0.15 },
    ],
    aiLeverage: 50,
    typicalPrepMonths: 0,
    description: "把行业、运营和数据洞察转化为业务建议。",
    position: { x: 12, y: 84 },
  },
  {
    id: "bridge-ai-product-analyst",
    title: "AI 产品分析师",
    family: "product",
    stage: "bridge",
    requiredSkills: [
      { skillId: "product-discovery", weight: 0.25 },
      { skillId: "experiment-design", weight: 0.2 },
      { skillId: "data-analysis", weight: 0.2 },
      { skillId: "stakeholder-management", weight: 0.2 },
      { skillId: "responsible-ai", weight: 0.15 },
    ],
    aiLeverage: 80,
    typicalPrepMonths: 3,
    description: "用用户问题、数据证据和模型边界定义 AI 产品机会。",
    position: { x: 49, y: 10 },
  },
  {
    id: "bridge-people-data-scientist",
    title: "People Analytics 数据科学家",
    family: "data-science",
    stage: "bridge",
    requiredSkills: [
      { skillId: "data-analysis", weight: 0.25 },
      { skillId: "machine-learning", weight: 0.2 },
      { skillId: "causal-inference", weight: 0.2 },
      { skillId: "experiment-design", weight: 0.15 },
      { skillId: "data-visualization", weight: 0.1 },
      { skillId: "stakeholder-management", weight: 0.1 },
    ],
    aiLeverage: 84,
    typicalPrepMonths: 3,
    description: "将人才领域知识与预测、因果和实验方法结合。",
    position: { x: 49, y: 37 },
  },
  {
    id: "bridge-ai-solutions-consultant",
    title: "AI 解决方案分析师",
    family: "solutions",
    stage: "bridge",
    requiredSkills: [
      { skillId: "business-analysis", weight: 0.25 },
      { skillId: "solution-design", weight: 0.25 },
      { skillId: "stakeholder-management", weight: 0.2 },
      { skillId: "data-analysis", weight: 0.15 },
      { skillId: "machine-learning", weight: 0.15 },
    ],
    aiLeverage: 76,
    typicalPrepMonths: 2,
    description: "把业务需求、数据条件和模型能力组织成可交付方案。",
    position: { x: 49, y: 64 },
  },
  {
    id: "bridge-responsible-ai-researcher",
    title: "负责任 AI 研究员",
    family: "responsible-ai",
    stage: "bridge",
    requiredSkills: [
      { skillId: "responsible-ai", weight: 0.3 },
      { skillId: "causal-inference", weight: 0.2 },
      { skillId: "experiment-design", weight: 0.2 },
      { skillId: "machine-learning", weight: 0.15 },
      { skillId: "stakeholder-management", weight: 0.15 },
    ],
    aiLeverage: 88,
    typicalPrepMonths: 4,
    description: "评估模型对用户、岗位和组织决策的影响与风险。",
    position: { x: 49, y: 91 },
  },
  {
    id: "target-ai-product-manager",
    title: "AI 产品经理",
    family: "product",
    stage: "target",
    requiredSkills: [
      { skillId: "product-discovery", weight: 0.25 },
      { skillId: "stakeholder-management", weight: 0.2 },
      { skillId: "experiment-design", weight: 0.15 },
      { skillId: "business-analysis", weight: 0.15 },
      { skillId: "nlp-embeddings", weight: 0.1 },
      { skillId: "responsible-ai", weight: 0.08 },
      { skillId: "data-analysis", weight: 0.07 },
    ],
    aiLeverage: 86,
    typicalPrepMonths: 6,
    description: "定义 AI 用户价值、评估路径与产品边界。",
    position: { x: 86, y: 10 },
  },
  {
    id: "target-data-scientist",
    title: "数据科学家",
    family: "data-science",
    stage: "target",
    requiredSkills: [
      { skillId: "data-analysis", weight: 0.2 },
      { skillId: "machine-learning", weight: 0.2 },
      { skillId: "causal-inference", weight: 0.15 },
      { skillId: "nlp-embeddings", weight: 0.15 },
      { skillId: "graph-analytics", weight: 0.1 },
      { skillId: "experiment-design", weight: 0.1 },
      { skillId: "data-visualization", weight: 0.1 },
    ],
    aiLeverage: 94,
    typicalPrepMonths: 5,
    description: "将统计、机器学习和领域知识转化为可靠决策。",
    position: { x: 86, y: 37 },
  },
  {
    id: "target-ai-solutions-consultant",
    title: "AI 解决方案顾问",
    family: "solutions",
    stage: "target",
    requiredSkills: [
      { skillId: "business-analysis", weight: 0.22 },
      { skillId: "stakeholder-management", weight: 0.22 },
      { skillId: "solution-design", weight: 0.22 },
      { skillId: "data-analysis", weight: 0.12 },
      { skillId: "machine-learning", weight: 0.1 },
      { skillId: "product-discovery", weight: 0.07 },
      { skillId: "responsible-ai", weight: 0.05 },
    ],
    aiLeverage: 80,
    typicalPrepMonths: 4,
    description: "连接业务目标、数据现实和 AI 技术取舍。",
    position: { x: 86, y: 64 },
  },
  {
    id: "target-ai-application-engineer",
    title: "AI 应用工程师",
    family: "engineering",
    stage: "target",
    requiredSkills: [
      { skillId: "api-integration", weight: 0.25 },
      { skillId: "frontend-engineering", weight: 0.2 },
      { skillId: "machine-learning", weight: 0.2 },
      { skillId: "nlp-embeddings", weight: 0.15 },
      { skillId: "mlops", weight: 0.15 },
      { skillId: "responsible-ai", weight: 0.05 },
    ],
    aiLeverage: 100,
    typicalPrepMonths: 9,
    description: "把模型能力集成进可靠、可维护的用户应用。",
    position: { x: 86, y: 91 },
  },
];

const transitions: TransitionEdge[] = [
  {
    sourceRoleId: "current-is-researcher",
    targetRoleId: "bridge-ai-product-analyst",
    adjacency: 78,
    bridgeSkillIds: ["experiment-design", "product-discovery", "responsible-ai"],
    rationale: "研究问题定义与实验设计可迁移到 AI 产品发现。",
  },
  {
    sourceRoleId: "bridge-ai-product-analyst",
    targetRoleId: "target-ai-product-manager",
    adjacency: 84,
    bridgeSkillIds: ["product-discovery", "stakeholder-management"],
    rationale: "补齐产品取舍和跨团队交付后可承担端到端产品职责。",
  },
  {
    sourceRoleId: "current-talent-analyst",
    targetRoleId: "bridge-people-data-scientist",
    adjacency: 90,
    bridgeSkillIds: ["data-analysis", "causal-inference", "machine-learning"],
    rationale: "人才数据和招聘业务经验形成直接领域优势。",
  },
  {
    sourceRoleId: "bridge-people-data-scientist",
    targetRoleId: "target-data-scientist",
    adjacency: 82,
    bridgeSkillIds: ["machine-learning", "experiment-design", "data-visualization"],
    rationale: "将人才场景中的建模与实验能力推广到通用数据科学岗位。",
  },
  {
    sourceRoleId: "current-business-analyst",
    targetRoleId: "bridge-ai-solutions-consultant",
    adjacency: 88,
    bridgeSkillIds: ["business-analysis", "solution-design", "stakeholder-management"],
    rationale: "咨询和业务分析可直接承接 AI 方案发现与价值论证。",
  },
  {
    sourceRoleId: "bridge-ai-solutions-consultant",
    targetRoleId: "target-ai-solutions-consultant",
    adjacency: 92,
    bridgeSkillIds: ["solution-design", "machine-learning", "responsible-ai"],
    rationale: "补充模型边界和实施路径即可扩展为完整 AI 解决方案。",
  },
  {
    sourceRoleId: "current-is-researcher",
    targetRoleId: "bridge-responsible-ai-researcher",
    adjacency: 82,
    bridgeSkillIds: ["causal-inference", "experiment-design", "responsible-ai"],
    rationale: "职业影响研究可迁移到 AI 风险、评估与治理。",
  },
  {
    sourceRoleId: "bridge-people-data-scientist",
    targetRoleId: "bridge-responsible-ai-researcher",
    adjacency: 70,
    bridgeSkillIds: ["experiment-design", "responsible-ai"],
    rationale: "人才算法场景提供公平性和决策风险研究入口。",
  },
  {
    sourceRoleId: "bridge-ai-product-analyst",
    targetRoleId: "target-ai-application-engineer",
    adjacency: 46,
    bridgeSkillIds: ["api-integration", "frontend-engineering"],
    rationale: "需要显著补强产品工程与模型集成能力。",
  },
  {
    sourceRoleId: "bridge-responsible-ai-researcher",
    targetRoleId: "target-ai-application-engineer",
    adjacency: 58,
    bridgeSkillIds: ["api-integration", "mlops", "responsible-ai"],
    rationale: "评估能力需要通过工程化与监控能力转化为应用交付。",
  },
];

const routes: RouteDefinition[] = [
  {
    id: "route-ai-product",
    label: "AI 产品经理",
    roleIds: ["current-is-researcher", "bridge-ai-product-analyst", "target-ai-product-manager"],
    estimatedMonths: 6,
    actionSeeds: [
      {
        gapSkillId: "product-discovery",
        deliverable: "完成 8 次 AI 求职者访谈并形成机会地图",
        evidenceGoal: "提交一份包含问题定义、取舍和验证指标的 PRD",
      },
      {
        gapSkillId: "api-integration",
        deliverable: "接入一个真实模型端点并实现失败回退",
        evidenceGoal: "用演示视频证明稳定模式与 Live AI 模式边界",
      },
    ],
  },
  {
    id: "route-people-data-science",
    label: "People Analytics 数据科学家",
    roleIds: ["current-talent-analyst", "bridge-people-data-scientist", "target-data-scientist"],
    estimatedMonths: 5,
    actionSeeds: [
      {
        gapSkillId: "mlops",
        deliverable: "为评分引擎建立数据漂移与回归监控样例",
        evidenceGoal: "展示从研究模型到可维护分析产品的迁移",
      },
    ],
  },
  {
    id: "route-ai-solutions",
    label: "AI 解决方案顾问",
    roleIds: ["current-business-analyst", "bridge-ai-solutions-consultant", "target-ai-solutions-consultant"],
    estimatedMonths: 4,
    actionSeeds: [
      {
        gapSkillId: "solution-design",
        deliverable: "完成一份从业务问题到模型边界的 AI 方案蓝图",
        evidenceGoal: "用成本、风险和可解释性说明方案取舍",
      },
    ],
  },
];

export const dataset: DemoDataset = {
  profile,
  skills,
  roles,
  transitions,
  routes,
};

