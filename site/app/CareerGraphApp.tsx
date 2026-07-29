"use client";

export function CareerGraphApp() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <header className="app-header">
        <div>
          <p className="eyebrow">Career intelligence / curated demo</p>
          <h1>
            CareerGraph <span>AI</span>
          </h1>
          <p className="promise">看见、比较并质疑 AI 的职业决策依据。</p>
        </div>
        <div className="header-actions">
          <button className="mode-pill" type="button">
            ● 稳定演示
          </button>
          <button className="primary-button" type="button">
            开始三分钟讲解
          </button>
        </div>
      </header>

      <main className="workspace" id="main-content">
        <section className="panel profile-panel" aria-label="候选人画像与偏好">
          <p className="section-index">01 / PROFILE</p>
          <h2>Yueer W.</h2>
          <p>信息系统博士 · 职业与人才数据研究者</p>
          <div className="coming-note">
            证据画像与决策偏好即将接入。
          </div>
        </section>

        <section className="panel graph-panel" aria-label="职业跃迁图谱">
          <p className="section-index">02 / MAP</p>
          <h2>职业跃迁图谱</h2>
          <div className="coming-note">
            当前角色、桥接角色与目标角色将在这里形成可追溯路径。
          </div>
        </section>

        <section className="panel route-panel" aria-label="路径比较">
          <p className="section-index">03 / ROUTES</p>
          <h2>路径比较</h2>
          <div className="coming-note">
            三条路径将按技能、邻近、证据、AI 杠杆和速度比较。
          </div>
        </section>
      </main>
    </div>
  );
}

