# RoleRadar AI 发布验证记录

最后更新：2026-08-05（Asia/Shanghai）

## 当前结论

本地产品、真实数据 seed、隐私边界、离线能力和三视口面试旅程已经通过。公开 GitHub repository、`market-data` branch、Pages URL 与 Lighthouse 仍等待用户授权后创建和填写；旧的私有部署未更改。

## 版本与数据

| 项目 | 结果 |
|---|---|
| 实现 branch | `feature/careergraph-ai` |
| Task 13 commit | `5016a61` |
| 当前公开岗位 | 65 |
| 启用来源 | Anthropic Greenhouse、Binance Lever |
| 最近 live probe | Greenhouse 397；Lever 295；2026-08-05 通过 |
| snapshotAt | `2026-08-05T14:47:59.002Z` |
| dataRevision | `070567c3a168561b0d3e25904188cc05fe6430ea8dbc675d1d6bf335a11bdbc4` |
| 语义模式 | 固定多语言 E5；失败时 `tfidf-v1` / rules-fallback |

## 本地验证证据

| 验证 | 结果 |
|---|---|
| Repository hygiene | 3/3 通过 |
| Pages workflow contract | 1/1 通过 |
| Component tests | 已纳入 Task 14 全量 Vitest，全部通过 |
| Desktop / tablet / mobile E2E | 6/6 通过，串行 6.1 秒 |
| Lint | 通过，exit 0 |
| TypeScript | 通过，exit 0 |
| Vite production build | 通过；JS gzip 94.41 kB |
| 最新 Task 14 全量 `npm test` | 21 files、44/44 tests 通过 |
| 最新 Task 14 E2E | 3 个视口、6/6 tests 通过 |

真实浏览器人工复核：

- 1440px：首屏、市场卡片、岗位簇、真实岗位详情和双栏 JD 抽屉无裁切；
- 390×844：header、CTA、指标卡和岗位簇按单列重排，无横向溢出；
- 聚类节点与按钮标签在桌面/手机均同心，ResizeObserver 会按容器宽高比校正 SVG ellipse；
- 冷启动 console error/warn 为 0；旧 HMR 标签不作为验收证据。

## 隐私与安全边界

- 公开候选人画像不包含手机号或邮箱；公开文本 artifact 通过 contact/API credential 模式检查。
- JD 文本仅存在于 React state；测试比较分析前后 local/session storage 键集合保持不变。
- BOSS 直聘与猎聘 URL 在 fetch 前被阻止，并提示复制职位描述。
- 自动读取只允许 HTTPS 的 `job-boards.greenhouse.io`、`boards.greenhouse.io` 与 `jobs.lever.co`。
- 浏览器不接收数据源 secret 或模型 API key。

## 数据与离线可靠性

- 只有 probe、schema、历史/health 一致性、tests 和 build 全部成功后才提交 market-data 与部署。
- `current.json` 使用 network-first；只有结构有效的 JSON 才覆盖 cache。
- navigation 使用 network-first 和 scope-root fallback；hashed assets 使用 cache-first。
- failed / opaque response 永不写入 cache；首次安装会预缓存根文档发现的同源静态依赖。
- Playwright 在 Service Worker 接管后切断网络并刷新，三个视口均恢复页面和岗位快照。

## 公开发布待填项

| 项目 | 状态 |
|---|---|
| GitHub repository | 待用户确认是否公开及 repository 名称 |
| source commit | 待发布 |
| `market-data` commit | 待发布 |
| GitHub Pages URL | 待发布 |
| unsigned / incognito 免登录检查 | 待发布 |
| 原站投递链接检查 | 待发布 |
| 公开 dataRevision | 待发布 |
| desktop screenshot | 待发布 |
| tablet screenshot | 待发布 |
| mobile screenshot | 待发布 |
| Lighthouse performance | 待发布，门槛 ≥90 |
| Lighthouse accessibility | 待发布，门槛 ≥90 |
| Lighthouse best practices | 待发布，门槛 ≥90 |
| Lighthouse SEO | 待发布，门槛 ≥90 |

## 公开验收步骤

1. 用未登录/隐身浏览器打开 Pages URL，确认无 OpenAI、ChatGPT 或 GitHub 登录跳转。
2. 核对页面 timestamp、revision、两个来源状态与 ≥20 条岗位。
3. 选择岗位，确认投递链接为对应 Greenhouse/Lever HTTPS 原站。
4. 粘贴 JD 并完成本地分析；关闭后确认没有 storage 写入。
5. 在 1440×900、1024×768、390×844 截图并检查横向溢出。
6. 运行 Lighthouse，四项均达到 90；记录报告与公开 dataRevision。
7. 只有上述项目全部通过后，才考虑下线旧的私有部署。
