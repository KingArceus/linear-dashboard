import type { InnovationIndexResult, IssueSnapshot, ThresholdStatus } from "../types.js";
import { toMonthKey, toQuarterKey } from "../utils.js";

function innovationStatus(countInQuarter: number): ThresholdStatus {
  if (countInQuarter >= 2) {
    return "green";
  }
  if (countInQuarter === 1) {
    return "yellow";
  }
  return "red";
}

function matchesInnovationLabel(labelNames: string[], innovationLabels: string[]): boolean {
  const normalizedLabels = innovationLabels.map(label => label.toLowerCase());
  return labelNames.some(labelName => normalizedLabels.includes(labelName.toLowerCase()));
}

export function computeInnovationIndex(
  issues: IssueSnapshot[],
  innovationLabels: string[],
  from: Date,
  to: Date
): InnovationIndexResult {
  const perMonth: Record<string, number> = {};
  const perQuarter: Record<string, number> = {};
  let countInPeriod = 0;

  for (const issue of issues) {
    if (!issue.completedAt) {
      continue;
    }
    if (issue.completedAt < from || issue.completedAt > to) {
      continue;
    }
    if (!matchesInnovationLabel(issue.labelNames, innovationLabels)) {
      continue;
    }

    countInPeriod += 1;
    const monthKey = toMonthKey(issue.completedAt);
    const quarterKey = toQuarterKey(issue.completedAt);
    perMonth[monthKey] = (perMonth[monthKey] ?? 0) + 1;
    perQuarter[quarterKey] = (perQuarter[quarterKey] ?? 0) + 1;
  }

  const quartersInRange = getQuartersInRange(from, to);
  const quarterCounts = quartersInRange.map(quarter => perQuarter[quarter] ?? 0);
  const avgPerQuarter =
    quarterCounts.length > 0 ? quarterCounts.reduce((sum, count) => sum + count, 0) / quarterCounts.length : 0;
  const statusQuarterCount = Math.round(avgPerQuarter);

  return {
    countInPeriod,
    perMonth,
    perQuarter,
    status: innovationStatus(statusQuarterCount),
    unit: "count",
  };
}

function getQuartersInRange(from: Date, to: Date): string[] {
  const quarters = new Set<string>();
  const cursor = new Date(from);
  while (cursor <= to) {
    quarters.add(toQuarterKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return [...quarters];
}
