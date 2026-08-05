import type { SnapshotFreshness } from "../data/loadSnapshot";
import type {
  ExplorerFamily,
  ExplorerSort,
  ExplorerSource,
  LocationScope,
} from "../state/useJobExplorer";

interface JobFiltersProps {
  query: string;
  location: LocationScope;
  family: ExplorerFamily;
  source: ExplorerSource;
  sort: ExplorerSort;
  minMatch: number;
  freshness: SnapshotFreshness;
  onQuery: (value: string) => void;
  onLocation: (value: LocationScope) => void;
  onFamily: (value: ExplorerFamily) => void;
  onSource: (value: ExplorerSource) => void;
  onSort: (value: ExplorerSort) => void;
  onMinMatch: (value: number) => void;
}

export function JobFilters(props: JobFiltersProps) {
  return (
    <div className="job-filters">
      <label className="filter-search">
        <span>搜索职位或公司</span>
        <input
          type="search"
          value={props.query}
          onChange={(event) => props.onQuery(event.currentTarget.value)}
          placeholder="例如：AI Product / Anthropic"
        />
      </label>
      <label>
        <span>地点范围</span>
        <select
          value={props.location}
          onChange={(event) => props.onLocation(event.currentTarget.value as LocationScope)}
        >
          <option value="default">中国 / 港新 / 远程亚洲</option>
          <option value="global">其他全球岗位</option>
          <option value="all">全部地点</option>
        </select>
      </label>
      <label>
        <span>角色方向</span>
        <select
          value={props.family}
          onChange={(event) => props.onFamily(event.currentTarget.value as ExplorerFamily)}
        >
          <option value="all">全部角色</option>
          <option value="ai-product">AI 产品</option>
          <option value="ai-solutions">AI 解决方案</option>
          <option value="data-science">数据科学</option>
          <option value="ai-engineering">AI 工程</option>
          <option value="people-analytics">人才分析</option>
        </select>
      </label>
      <label>
        <span>数据来源</span>
        <select
          value={props.source}
          onChange={(event) => props.onSource(event.currentTarget.value as ExplorerSource)}
        >
          <option value="all">全部来源</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
        </select>
      </label>
      <label>
        <span>排序方式</span>
        <select
          value={props.sort}
          onChange={(event) => props.onSort(event.currentTarget.value as ExplorerSort)}
        >
          <option value="match">匹配分</option>
          <option value="updated">最近更新</option>
          <option value="growth">角色增长</option>
        </select>
      </label>
      <label className="filter-range">
        <span>最低匹配分 {props.minMatch}</span>
        <input
          aria-label="最低匹配分"
          type="range"
          min="0"
          max="100"
          step="5"
          value={props.minMatch}
          onChange={(event) => props.onMinMatch(Number(event.currentTarget.value))}
        />
      </label>
      <div className="filter-freshness" aria-label={`快照状态：${props.freshness.label}`}>
        <span>快照状态</span>
        <strong className={`freshness-dot freshness-dot--${props.freshness.state}`}>
          {props.freshness.label}
        </strong>
      </div>
    </div>
  );
}
