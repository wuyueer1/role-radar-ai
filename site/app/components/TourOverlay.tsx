import { useState } from "react";

const STEPS = [
  {
    title: "传统匹配分隐藏了什么？",
    body: "先看证据，而不是先相信分数。CareerGraph 把推荐依据直接放到界面上。",
    target: "profile",
  },
  {
    title: "把经历转成带证据的能力",
    body: "每项核心能力都能回到具体研究、产业项目或业务结果。",
    target: "profile",
  },
  {
    title: "桥接岗位比终点更重要",
    body: "图谱展示从当前能力资产到目标 AI 岗位之间的可行台阶。",
    target: "graph",
  },
  {
    title: "推荐会随目标变化",
    body: "改变技术、商业或速度权重，排序、分数和解释会同步变化。",
    target: "routes",
  },
  {
    title: "把结论变成 90 天证据",
    body: "最后不是一句建议，而是分阶段交付物、证据目标和模型边界。",
    target: "drawer",
  },
] as const;

interface TourOverlayProps {
  onClose: () => void;
  onStepChange: (target: string) => void;
}

export function TourOverlay({
  onClose,
  onStepChange,
}: TourOverlayProps) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  function go(nextIndex: number) {
    setIndex(nextIndex);
    onStepChange(STEPS[nextIndex].target);
  }

  return (
    <aside
      className="tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
    >
      <div className="tour-progress">
        <span>{index + 1} / 5</span>
        <div>
          {STEPS.map((item, itemIndex) => (
            <i
              key={item.title}
              className={itemIndex <= index ? "is-complete" : ""}
            />
          ))}
        </div>
      </div>
      <p className="section-index">INTERVIEW MODE</p>
      <h2 id="tour-title">{step.title}</h2>
      <p>{step.body}</p>
      <div className="tour-actions">
        <button className="text-button" type="button" onClick={onClose}>
          退出讲解
        </button>
        {index > 0 && (
          <button
            className="secondary-button"
            type="button"
            onClick={() => go(index - 1)}
          >
            上一步
          </button>
        )}
        {index < STEPS.length - 1 ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => go(index + 1)}
          >
            下一步
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={onClose}>
            完成讲解
          </button>
        )}
      </div>
    </aside>
  );
}

