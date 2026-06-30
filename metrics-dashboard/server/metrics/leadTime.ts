import type { IssueSnapshot, PercentileMetricResult, ThresholdStatus } from "../types.js";
import { average, daysBetween } from "../utils.js";
import { percentile } from "./percentile.js";

function leadTimeStatus(p85Days: number): ThresholdStatus {
  if (p85Days <= 10) {
    return "green";
  }
  if (p85Days <= 20) {
    return "yellow";
  }
  return "red";
}

export function computeLeadTime(issues: IssueSnapshot[]): PercentileMetricResult {
  const leadTimes = issues
    .filter(issue => issue.completedAt)
    .map(issue => daysBetween(issue.createdAt, issue.completedAt!));

  const p85 = percentile(leadTimes, 85);

  return {
    average: average(leadTimes),
    p50: percentile(leadTimes, 50),
    p85,
    p95: percentile(leadTimes, 95),
    status: leadTimeStatus(p85),
    sampleSize: leadTimes.length,
    unit: "days",
  };
}
