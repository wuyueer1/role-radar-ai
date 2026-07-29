import { useEffect } from "react";

interface ModeDialogProps {
  onClose: () => void;
}

export function ModeDialog({ onClose }: ModeDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="mode-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-dialog-title"
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
        <button className="primary-button" type="button" onClick={onClose}>
          我明白了
        </button>
      </section>
    </div>
  );
}

