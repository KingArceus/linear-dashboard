import type { IssueSnapshot, PcvResult, ThresholdStatus } from "../types.js";

function pcvStatus(compliance: number): ThresholdStatus {
  if (compliance >= 90) {
    return "green";
  }
  if (compliance >= 75) {
    return "yellow";
  }
  return "red";
}

export function computePcv(issues: IssueSnapshot[]): PcvResult {
  let completedChecklistItems = 0;
  let totalChecklistItems = 0;
  let parentIssueCount = 0;

  for (const issue of issues) {
    if (issue.subIssues.length === 0) {
      continue;
    }

    parentIssueCount += 1;
    totalChecklistItems += issue.subIssues.length;
    completedChecklistItems += issue.subIssues.filter(subIssue => subIssue.completedAt).length;
  }

  const compliance = totalChecklistItems > 0 ? (completedChecklistItems / totalChecklistItems) * 100 : 100;

  return {
    compliance,
    status: pcvStatus(compliance),
    unit: "percent",
    completedChecklistItems,
    totalChecklistItems,
    parentIssueCount,
  };
}
