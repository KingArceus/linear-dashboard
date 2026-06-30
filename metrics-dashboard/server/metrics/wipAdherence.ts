import type { IssueSnapshot, ThresholdStatus, WipAdherenceResult } from "../types.js";

function wipAdherenceStatus(utilization: number): ThresholdStatus {
  if (utilization <= 100) {
    return "green";
  }
  if (utilization <= 120) {
    return "yellow";
  }
  return "red";
}

export function computeWipAdherence(inProgressIssues: IssueSnapshot[], wipLimit: number): WipAdherenceResult {
  const currentWip = inProgressIssues.length;
  const utilization = wipLimit > 0 ? (currentWip / wipLimit) * 100 : 0;

  return {
    currentWip,
    wipLimit,
    utilization,
    status: wipAdherenceStatus(utilization),
    unit: "percent",
  };
}
