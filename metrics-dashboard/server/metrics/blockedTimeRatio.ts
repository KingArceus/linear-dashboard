import type { BlockedTimeRatioResult, IssueSnapshot, ThresholdStatus, WorkflowStateSnapshot } from "../types.js";
import { timeInStateMs } from "./timeInState.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function blockedTimeStatus(ratioPercent: number): ThresholdStatus {
  if (ratioPercent <= 10) {
    return "green";
  }
  if (ratioPercent <= 20) {
    return "yellow";
  }
  return "red";
}

export function computeBlockedTimeRatio(
  issues: IssueSnapshot[],
  states: WorkflowStateSnapshot[],
  blockedStateName: string,
  endAt: Date
): BlockedTimeRatioResult {
  const blockedStateIds = new Set(
    states.filter(state => state.name.toLowerCase() === blockedStateName.toLowerCase()).map(state => state.id)
  );

  let totalBlockedMs = 0;
  let totalLeadMs = 0;
  let issueCount = 0;

  for (const issue of issues) {
    if (!issue.completedAt) {
      continue;
    }

    const leadMs = issue.completedAt.getTime() - issue.createdAt.getTime();
    if (leadMs <= 0) {
      continue;
    }

    const blockedMs =
      blockedStateIds.size > 0
        ? timeInStateMs(issue, issue.history, blockedStateIds, endAt)
        : 0;

    totalBlockedMs += blockedMs;
    totalLeadMs += leadMs;
    issueCount += 1;
  }

  const ratio = totalLeadMs > 0 ? (totalBlockedMs / totalLeadMs) * 100 : 0;

  return {
    ratio,
    status: blockedTimeStatus(ratio),
    unit: "percent",
    totalBlockedDays: totalBlockedMs / MS_PER_DAY,
    totalLeadDays: totalLeadMs / MS_PER_DAY,
    issueCount,
  };
}
