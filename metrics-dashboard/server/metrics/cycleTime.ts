import type { IssueSnapshot, PercentileMetricResult, ThresholdStatus } from "../types.js";
import { average, daysBetween } from "../utils.js";
import { percentile } from "./percentile.js";

function cycleTimeStatus(p85Days: number): ThresholdStatus {
  if (p85Days <= 5) {
    return "green";
  }
  if (p85Days <= 10) {
    return "yellow";
  }
  return "red";
}

export function computeCycleTime(issues: IssueSnapshot[]): PercentileMetricResult {
  const cycleTimes = issues
    .filter(issue => issue.startedAt && issue.completedAt)
    .map(issue => daysBetween(issue.startedAt!, issue.completedAt!));

  const p85 = percentile(cycleTimes, 85);

  return {
    average: average(cycleTimes),
    p50: percentile(cycleTimes, 50),
    p85,
    p95: percentile(cycleTimes, 95),
    status: cycleTimeStatus(p85),
    sampleSize: cycleTimes.length,
    unit: "days",
  };
}
