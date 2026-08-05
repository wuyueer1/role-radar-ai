# RoleRadar AI

RoleRadar AI 是一个公开、免登录的 AI 岗位机会分析器。它定时读取经过审查的官方招聘源，把真实岗位归一化、去重并映射到 AI 角色簇，再用候选人的可核验证据生成可复算的匹配解释。

核心主张：**把招聘市场变成可解释的个人机会。**

![RoleRadar AI 社交预览](public/og.png)

## 为什么做这个作品

作品围绕一个真实求职任务设计：面试官和候选人都需要知道“市场上现在有什么岗位、为什么值得关注、下一步应该补什么证据”，而不是只看一张静态简历。

它集中展示四类能力：

- 从失败的产品假设中重新定义核心用户任务；
- 招聘数据 adapter、schema、归一化、去重与 last-good 快照；
- 文本语义、职业邻近度与可解释匹配产品化；
- 无账号门槛、浏览器本地隐私与离线演示韧性。

## 核心体验

- 真实市场脉搏：当前岗位、新增/移除、最大角色簇和增长技能；
- 岗位簇地图：节点大小代表岗位数，颜色代表 7 日变化，连线代表共享技能；
- 可分享筛选：地点、角色、来源、排序、最低匹配分和 query 全部写入 URL；
- 证据追踪：岗位要求与候选人证据一一对应，并显示五项可复算分量；
- 原站投递：每个岗位保留 Greenhouse / Lever 官方申请链接；
- 本地 JD 分析：粘贴文本后在浏览器内计算，不上传、不持久化；
- 数据源健康与离线回退：单源失败不覆盖上一份有效数据。

## 数据与模型边界

- 当前启用来源：Anthropic Greenhouse 与 Binance Lever；来源必须先通过条款复核、HTTP 探测和 schema 校验。
- BOSS 直聘、猎聘等受平台限制的页面不会自动请求；用户可复制职位描述进行本地分析。
- 定时管线优先使用固定版本的多语言 E5；环境不可用时回退到具名的确定性 TF-IDF / 规则模式。
- 匹配分由技能 35%、证据 25%、语义 20%、角色邻近 10%、明确约束 10% 组成；它不是录用或面试概率。
- 浏览器不接收 API secret；粘贴的 JD 不写入 localStorage、sessionStorage、数据库或分析埋点。
- 岗位簇和趋势只代表已接入来源，不代表整个招聘市场。

来源契约：

- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html)
- [Lever Postings API](https://github.com/lever/postings-api)

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run dev
```

默认本地地址由 Vite 输出，通常为 `http://localhost:5173/`。

刷新真实数据需要 Python 3.12 与 `pipeline/embeddings/requirements-e5.txt` 中的固定依赖：

```bash
npm run data:probe
npm run data:update
```

## 验证

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright 会串行验证 1440×900、1024×768 与 390×844 三个视口，包括免账号访问、真实岗位、来源状态、筛选、证据、投递链接、本地 JD、焦点管理、横向溢出和离线刷新。

## 目录

```text
data/                 匿名候选人画像与来源注册表
pipeline/             探测、adapter、归一化、去重、匹配、快照与 embeddings
public/data/          最近一份验证成功的公开岗位快照
src/                  RoleRadar Vite/React 应用与领域逻辑
tests/                domain、pipeline 与 component 回归测试
e2e/                  三视口公开访问与面试旅程
public/sw.js          last-good 数据与离线应用缓存
```

## 设计、实现与交付

- [批准的重构设计](../docs/superpowers/specs/2026-07-30-ai-job-radar-redesign.md)
- [测试驱动实现计划](../docs/superpowers/plans/2026-08-05-role-radar-ai-implementation.md)
- [三分钟面试讲稿](../docs/role-radar-demo-script.md)
- [发布验证记录](../docs/role-radar-validation.md)
- 公开站点：等待确认 GitHub repository 后填入

站点将由 GitHub Actions 每 4 小时刷新已审查来源，并只在 probe、数据更新、测试和构建全部成功后发布。旧的私有部署在公开地址通过验收前保持不变。
