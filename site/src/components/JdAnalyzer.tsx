import { useRef, useState } from "react";
import profileJson from "../../data/candidate-profile.json";
import { analyzeLocalJd, type LocalJdResult } from "../domain/matching";
import { parseCandidateProfile } from "../domain/schemas";
import { useDialogFocus } from "./useDialogFocus";

interface JdAnalyzerProps {
  open: boolean;
  onClose: () => void;
  fetcher?: typeof fetch;
}

const profile = parseCandidateProfile(profileJson);

const sampleJd = `AI 产品经理
负责把人才与职业数据转化为可解释的 AI 产品能力，与业务、设计和工程团队共同定义问题、规划路线图并验证用户价值。
岗位要求：具备数据分析、产品发现和利益相关方管理经验；能够使用机器学习或 NLP embeddings 评估方案；熟悉实验设计和数据可视化。
优先考虑有招聘、人力资源科技或企业级解决方案经验的候选人。需要用清晰证据说明模型边界、业务影响与迭代方向。`;

const blockedPlatform = (hostname: string): boolean =>
  hostname === "zhipin.com" ||
  hostname.endsWith(".zhipin.com") ||
  hostname === "liepin.com" ||
  hostname.endsWith(".liepin.com");

const allowedPublicHost = (hostname: string): boolean =>
  hostname === "job-boards.greenhouse.io" ||
  hostname === "boards.greenhouse.io" ||
  hostname === "jobs.lever.co";

type LocalJdFailureReason = Exclude<LocalJdResult, { ok: true }>["reason"];

const failureMessage = (reason: LocalJdFailureReason) =>
  reason === "JD_TEXT_TOO_SHORT"
    ? "职位描述内容太短，请粘贴完整职责与要求后再分析。"
    : "职位描述包含过多无法识别的字符，请换用纯文本。";

export function JdAnalyzer({ open, onClose, fetcher = fetch }: JdAnalyzerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Extract<LocalJdResult, { ok: true }> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useDialogFocus(open, dialogRef, onClose);

  if (!open) return null;

  const analyze = async () => {
    const input = value.trim();
    setError("");
    setResult(null);
    if (!input) {
      setError("请粘贴职位描述，或填入支持的公开岗位链接。");
      return;
    }

    let text = input;
    if (/^https?:\/\//i.test(input)) {
      let url: URL;
      try {
        url = new URL(input);
      } catch {
        setError("链接格式无法识别，请改为粘贴职位描述正文。");
        return;
      }
      if (blockedPlatform(url.hostname)) {
        setError("平台限制自动读取，请复制职位描述");
        return;
      }
      if (!allowedPublicHost(url.hostname) || url.protocol !== "https:") {
        setError("当前仅自动读取 Greenhouse / Lever 公开链接；其他平台请粘贴职位描述。");
        return;
      }
      setBusy(true);
      try {
        const response = await fetcher(url.toString(), {
          headers: { Accept: "text/html,application/xhtml+xml" },
        });
        if (!response.ok || response.type === "opaque") {
          throw new Error("unavailable");
        }
        text = await response.text();
      } catch {
        setError("公开链接暂时无法读取，请复制职位描述正文后继续本地分析。");
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    const analysis = analyzeLocalJd(text, profile);
    if (!analysis.ok) {
      setError(failureMessage(analysis.reason));
      return;
    }
    setResult(analysis);
  };

  const clear = () => {
    setValue("");
    setResult(null);
    setError("");
  };

  return (
    <div className="dialog-backdrop jd-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        aria-labelledby="jd-analyzer-title"
        aria-modal="true"
        className="jd-drawer"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">PRIVATE-BY-DESIGN / NO LOGIN</p>
            <h2 id="jd-analyzer-title">本地 JD 分析</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭 JD 分析">
            ×
          </button>
        </div>
        <div className="jd-grid">
          <div className="jd-input-panel">
            <label htmlFor="jd-input">职位描述</label>
            <textarea
              id="jd-input"
              onChange={(event) => setValue(event.target.value)}
              placeholder="粘贴完整 JD，或输入 Greenhouse / Lever 公开岗位链接"
              rows={11}
              value={value}
            />
            <p className="privacy-note">
              输入只在当前浏览器内存中参与计算，不上传、不写入 localStorage / sessionStorage，也不用于分析埋点。
            </p>
            {error ? <p className="jd-error" role="alert">{error}</p> : null}
            <div className="jd-actions">
              <button className="primary-action" disabled={busy} type="button" onClick={() => void analyze()}>
                {busy ? "正在读取…" : "开始本地分析"}
              </button>
              <button type="button" onClick={() => { setValue(sampleJd); setError(""); setResult(null); }}>
                填入示例
              </button>
              <button type="button" onClick={clear}>清空</button>
            </div>
          </div>
          <div className="jd-result" aria-live="polite">
            {result ? (
              <>
                <p className="eyebrow">本地即时分析</p>
                <div className="jd-result-heading">
                  <div>
                    <h3>{result.titleGuess}</h3>
                    <p>{result.analysis.explanation}</p>
                  </div>
                  <strong aria-label={`本地匹配分 ${result.analysis.matchScore}`}>
                    {result.analysis.matchScore}
                  </strong>
                </div>
                <dl className="jd-score-grid">
                  {Object.entries(result.analysis.componentScores).map(([key, score]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{score}</dd>
                    </div>
                  ))}
                </dl>
                <div className="jd-insight-grid">
                  <section>
                    <h4>可证明优势</h4>
                    <ul>{result.analysis.strengths.slice(0, 4).map((item, index) => <li key={`${index}:${item}`}>{item}</li>)}</ul>
                  </section>
                  <section>
                    <h4>面试前补强</h4>
                    <ul>{result.analysis.gaps.slice(0, 4).map((item, index) => <li key={`${index}:${item}`}>{item}</li>)}</ul>
                  </section>
                </div>
              </>
            ) : (
              <div className="jd-empty-result">
                <span>LOCAL</span>
                <h3>一条 JD，五个可复算分量</h3>
                <p>技能、证据、文本相关度、角色邻近度与约束共同构成结果，不生成“录用概率”。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
