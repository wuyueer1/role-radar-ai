export function RoleRadarApp() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <header className="app-header">
        <div>
          <p className="eyebrow">AI JOB INTELLIGENCE / PUBLIC PORTFOLIO</p>
          <h1>
            RoleRadar <span>AI</span>
          </h1>
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
