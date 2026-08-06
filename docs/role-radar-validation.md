# RoleRadar AI 发布验证记录

最后更新：2026-08-06（Asia/Shanghai）

## 当前结论

RoleRadar 已发布到公开 GitHub Pages，无需 OpenAI、ChatGPT 或 GitHub 账号即可访问。真实数据刷新、隐私边界、离线能力、三视口面试旅程、公开浏览器关键交互与四类 Lighthouse 审计均已执行；旧的私有部署仍未更改。

## 版本与数据

| 项目 | 结果 |
|---|---|
| 实现 branch | `feature/careergraph-ai` |
| Task 13 commit | `5016a61` |
| deployed app source commit | `05599fd195542507592245d929719a16339a1707` |
| `market-data` commit | `797c5ef34bbc3bc96bf54fdb6e538b91541c0140` |
| 当前公开岗位 | 64 |
| 启用来源 | Anthropic Greenhouse、Binance Lever |
| 最近 live probe | Greenhouse 395；Lever 294；2026-08-06 通过 |
| snapshotAt | `2026-08-06T05:57:15.692Z` |
| dataRevision | `f222359ba15ed7c96764993e9d0b3a5952bd52ad89c4ef017616da16999b580c` |
| 语义模式 | 固定多语言 E5；失败时 `tfidf-v1` / rules-fallback |

## 本地验证证据

| 验证 | 结果 |
|---|---|
| Repository hygiene | 3/3 通过 |
| Pages workflow contract | 1/1 通过 |
| Component tests | 已纳入 Task 14 全量 Vitest，全部通过 |
| Desktop / tablet / mobile E2E | 6/6 通过，最新发布前串行 10.9 秒 |
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

## 公开发布证据

| 项目 | 状态 |
|---|---|
| GitHub repository | [wuyueer1/role-radar-ai](https://github.com/wuyueer1/role-radar-ai)，PUBLIC，默认分支 `main` |
| deployed app source commit | `05599fd195542507592245d929719a16339a1707`，与成功 run 的 `headSha` 一致 |
| `market-data` commit | `797c5ef34bbc3bc96bf54fdb6e538b91541c0140` |
| GitHub Pages URL | [https://wuyueer1.github.io/role-radar-ai/](https://wuyueer1.github.io/role-radar-ai/) |
| GitHub Actions | run `31075349798`，attempt 2，3m47s，全部步骤通过 |
| unsigned / clean-tab 免登录检查 | 通过；直接进入 RoleRadar，无身份验证跳转 |
| 原站投递链接检查 | 通过；当前首个岗位指向 `jobs.lever.co/binance/.../apply` HTTPS 链接 |
| 公开 dataRevision | `f222359ba15ed7c96764993e9d0b3a5952bd52ad89c4ef017616da16999b580c` |
| desktop screenshot | 通过；hero、市场卡、来源健康 modal 无裁切 |
| tablet screenshot | 通过；Playwright 1024×768 无横向溢出 |
| mobile screenshot | 通过；Playwright 390×844 无横向溢出 |
| Lighthouse performance | 82；FCP/LCP 2.2s、TBT 30ms、CLS 0.178、SI 7.3s；低于 stretch target 90 |
| Lighthouse accessibility | 96 |
| Lighthouse best practices | 100 |
| Lighthouse SEO | 91 |

Lighthouse 使用 `13.4.1` 与模拟移动网络。首次运行得到 84/100/100/100，但带有 `page loaded too slowly`、结果可能不完整的 warning；上表采用第二次无 warning 的 82/96/100/91 作为权威记录。

## 公开验收步骤

1. 用未登录/隐身浏览器打开 Pages URL，确认无 OpenAI、ChatGPT 或 GitHub 登录跳转。
2. 核对页面 timestamp、revision、两个来源状态与 ≥20 条岗位。
3. 选择岗位，确认投递链接为对应 Greenhouse/Lever HTTPS 原站。
4. 粘贴 JD 并完成本地分析；关闭后确认没有 storage 写入。
5. 在 1440×900、1024×768、390×844 截图并检查横向溢出。
6. 运行 Lighthouse 并记录四项分数、报告版本与公开 dataRevision；Performance 未达 90 时保留真实结果，不阻止已经通过功能与质量门禁的公开交付。
7. 新的公开站点通过后，旧私有部署仍保持不动；是否下线由用户另行决定。
