import type { MetricsInput, MetricsResult } from "../types.js";
import { computeBlockedTimeRatio } from "./blockedTimeRatio.js";
import { computeCycleTime } from "./cycleTime.js";
import { computeInnovationIndex } from "./innovationIndex.js";
import { computeLeadTime } from "./leadTime.js";
import { computePcv } from "./pcv.js";
import { computeWipAdherence } from "./wipAdherence.js";

export function computeAllMetrics(input: MetricsInput): MetricsResult {
  const completedIssues = input.issues.filter(
    issue => issue.completedAt && issue.completedAt >= input.from && issue.completedAt <= input.to
  );

  return {
    teamId: input.teamId,
    teamName: input.teamName,
    from: input.from.toISOString(),
    to: input.to.toISOString(),
    cycleTime: computeCycleTime(completedIssues),
    leadTime: computeLeadTime(completedIssues),
    blockedTimeRatio: computeBlockedTimeRatio(
      completedIssues,
      input.states,
      input.config.blockedStateName,
      input.to
    ),
    wipAdherence: computeWipAdherence(input.inProgressIssues, input.config.wipLimit),
    workloads: input.workloads,
    pcv: computePcv(completedIssues),    innovationIndex: computeInnovationIndex(
      completedIssues,
      input.config.innovationLabels,
      input.from,
      input.to
    ),
  };
}

export { computeBlockedTimeRatio } from "./blockedTimeRatio.js";
export { computeCycleTime } from "./cycleTime.js";
export { computeInnovationIndex } from "./innovationIndex.js";
export { computeLeadTime } from "./leadTime.js";
export { computePcv } from "./pcv.js";
export { percentile } from "./percentile.js";
export { buildStateIntervals, timeInStateMs } from "./timeInState.js";
export { computeWipAdherence } from "./wipAdherence.js";
