import type { RoleFamily } from "./types";

export interface DailyMarketRecord {
  date: string;
  jobIds: string[];
  skillJobIds: Record<string, string[]>;
  roleFamilyJobIds: Partial<Record<RoleFamily, string[]>>;
}

export interface SkillTrend {
  skillId: string;
  jobCount: number;
  sampleSize: number;
  share: number;
  delta7d: number;
  delta30d: number;
}

export interface MarketTrends {
  scope: "connected-sources-only";
  asOfDate: string;
  activeJobCount: number;
  newJobCount: number;
  removedJobCount: number;
  skillStats: SkillTrend[];
  roleFamilyStats: Array<{ roleFamily: RoleFamily; jobCount: number; delta7d: number }>;
  periods: {
    latest7Days: number;
    previous7Days: number;
    latest30Days: number;
    previous30Days: number;
  };
}

const dateValue = (value: string): number => Date.parse(`${value}T00:00:00.000Z`);

const shiftDate = (value: string, days: number): string => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const selectWindow = (
  history: DailyMarketRecord[],
  endExclusive: string,
  days: number,
): DailyMarketRecord[] => {
  const start = shiftDate(endExclusive, -days);
  return history
    .filter((record) => record.date >= start && record.date < endExclusive)
    .sort((left, right) => dateValue(left.date) - dateValue(right.date));
};

const averageShare = (
  records: DailyMarketRecord[],
  skillId: string,
): number => {
  if (records.length === 0) return 0;
  return (
    records.reduce((sum, record) => {
      const denominator = new Set(record.jobIds).size;
      const numerator = new Set(record.skillJobIds[skillId] ?? []).size;
      return sum + (denominator === 0 ? 0 : numerator / denominator);
    }, 0) / records.length
  );
};

const finalRecord = (records: DailyMarketRecord[]): DailyMarketRecord | undefined =>
  records.at(-1);

const differenceCount = (left: string[], right: string[]): number => {
  const rightSet = new Set(right);
  return new Set(left.filter((item) => !rightSet.has(item))).size;
};

const round4 = (value: number): number => Number(value.toFixed(4));

export function computeTrends(
  history: DailyMarketRecord[],
  asOfDate: string,
): MarketTrends {
  const latest7 = selectWindow(history, asOfDate, 7);
  const previous7End = shiftDate(asOfDate, -7);
  const previous7 = selectWindow(history, previous7End, 7);
  const latest30 = selectWindow(history, asOfDate, 30);
  const previous30End = shiftDate(asOfDate, -30);
  const previous30 = selectWindow(history, previous30End, 30);
  const current = finalRecord(latest7) ?? finalRecord(latest30);
  const comparison = finalRecord(previous7);
  const currentJobIds = [...new Set(current?.jobIds ?? [])];
  const comparisonJobIds = [...new Set(comparison?.jobIds ?? [])];

  const skillStats: SkillTrend[] = Object.entries(current?.skillJobIds ?? {})
    .map(([skillId, jobIds]) => {
      const jobCount = new Set(jobIds).size;
      const sampleSize = currentJobIds.length;
      return {
        skillId,
        jobCount,
        sampleSize,
        share: round4(sampleSize === 0 ? 0 : jobCount / sampleSize),
        delta7d: round4(averageShare(latest7, skillId) - averageShare(previous7, skillId)),
        delta30d: round4(averageShare(latest30, skillId) - averageShare(previous30, skillId)),
      };
    })
    .filter((skill) => skill.jobCount >= 5)
    .sort((left, right) => right.delta7d - left.delta7d || left.skillId.localeCompare(right.skillId));

  const roleFamilyStats = Object.entries(current?.roleFamilyJobIds ?? {})
    .map(([roleFamily, jobIds]) => ({
      roleFamily: roleFamily as RoleFamily,
      jobCount: new Set(jobIds).size,
      delta7d:
        new Set(jobIds).size -
        new Set(comparison?.roleFamilyJobIds[roleFamily as RoleFamily] ?? []).size,
    }))
    .sort((left, right) => right.jobCount - left.jobCount || left.roleFamily.localeCompare(right.roleFamily));

  return {
    scope: "connected-sources-only",
    asOfDate,
    activeJobCount: currentJobIds.length,
    newJobCount: differenceCount(currentJobIds, comparisonJobIds),
    removedJobCount: differenceCount(comparisonJobIds, currentJobIds),
    skillStats,
    roleFamilyStats,
    periods: {
      latest7Days: latest7.length,
      previous7Days: previous7.length,
      latest30Days: latest30.length,
      previous30Days: previous30.length,
    },
  };
}
