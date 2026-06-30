import type { IssueSnapshot, StateHistoryEntry } from "../types.js";

export interface StateInterval {
  stateId: string;
  start: Date;
  end: Date;
  durationMs: number;
}

export function buildStateIntervals(
  issue: Pick<IssueSnapshot, "createdAt" | "completedAt" | "stateId">,
  history: StateHistoryEntry[],
  endAt: Date
): StateInterval[] {
  const end = issue.completedAt ?? endAt;
  const stateChanges = history
    .filter(entry => entry.toStateId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (stateChanges.length === 0) {
    return [
      {
        stateId: issue.stateId,
        start: issue.createdAt,
        end,
        durationMs: end.getTime() - issue.createdAt.getTime(),
      },
    ];
  }

  const intervals: StateInterval[] = [];
  let currentStateId = stateChanges[0].fromStateId ?? stateChanges[0].toStateId ?? issue.stateId;
  let intervalStart = issue.createdAt;

  for (const change of stateChanges) {
    if (!change.toStateId) {
      continue;
    }

    const intervalEnd = change.createdAt;
    if (currentStateId) {
      intervals.push({
        stateId: currentStateId,
        start: intervalStart,
        end: intervalEnd,
        durationMs: intervalEnd.getTime() - intervalStart.getTime(),
      });
    }

    currentStateId = change.toStateId;
    intervalStart = change.createdAt;
  }

  if (currentStateId) {
    intervals.push({
      stateId: currentStateId,
      start: intervalStart,
      end,
      durationMs: end.getTime() - intervalStart.getTime(),
    });
  }

  return intervals;
}

export function timeInStateMs(
  issue: Pick<IssueSnapshot, "createdAt" | "completedAt" | "stateId">,
  history: StateHistoryEntry[],
  stateIds: Set<string>,
  endAt: Date
): number {
  return buildStateIntervals(issue, history, endAt)
    .filter(interval => stateIds.has(interval.stateId))
    .reduce((sum, interval) => sum + interval.durationMs, 0);
}
