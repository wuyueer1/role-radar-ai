import { useState } from "react";

import { analyzeProfileWithFallback } from "../lib/career-engine.ts";
import { useDialogFocus } from "./useDialogFocus";

interface ModeDialogProps {
  onClose: () => void;
}

export function ModeDialog({ onClose }: ModeDialogProps) {
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  const [originalText, setOriginalText] = useState("");
  const [notice, setNotice] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function verifyFallback() {
    setIsChecking(true);
    const result = await analyzeProfileWithFallback(originalText, {
      async analyze() {
        throw new Error("Live AI endpoint is not configured");
      },
    });
    setNotice(result.notice);
    setIsChecking(false);
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="mode-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-dialog-title"
        tabIndex={-1}
      >
        <p className="section-index">MODEL BOUNDARY</p>
        <h2 id="mode-dialog-title">模型边界</h2>
        <div className="mode-status">
          <span aria-hidden="true">●</span>
          <div>
            <strong>Live AI 未配置</strong>
            <p>稳定演示仍可完成全部核心流程。</p>
          </div>
        </div>
        <p>
          Live AI 仅负责自由文本结构化和语言表达；路径分数由本地引擎计算，
          模型不能创造简历证据，也不能改写底层分数。
        </p>
        <p className="notice">
          浏览器不保存密钥；只有配置同源服务端端点后，Live AI 才会启用。
        </p>
        <label className="live-ai-demo">
          <span>自由文本经历</span>
          <textarea
            data-autofocus
            value={originalText}
            onChange={(event) => setOriginalText(event.target.value)}
            placeholder="粘贴一段经历，验证模型不可用时原文仍被保留"
          />
        </label>
        {notice && (
          <p className="fallback-notice" role="status">
            {notice}
          </p>
        )}
        <div className="mode-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={verifyFallback}
            disabled={isChecking}
          >
            {isChecking ? "验证中…" : "验证稳定降级"}
          </button>
          <button type="button" disabled>
            启用 Live AI（需服务端端点）
          </button>
          <button className="primary-button" type="button" onClick={onClose}>
            我明白了
          </button>
        </div>
      </section>
    </div>
  );
}
