import { describe, expect, it } from "vitest";
import type { IssueSnapshot } from "../types.js";
import { computeBlockedTimeRatio } from "./blockedTimeRatio.js";
import { computeCycleTime } from "./cycleTime.js";
import { computeInnovationIndex } from "./innovationIndex.js";
import { computeLeadTime } from "./leadTime.js";
import { computePcv } from "./pcv.js";
import { percentile } from "./percentile.js";
import { buildStateIntervals } from "./timeInState.js";
import { computeWipAdherence } from "./wipAdherence.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * MS_PER_DAY);
}

function makeIssue(overrides: Partial<IssueSnapshot> = {}): IssueSnapshot {
  return {
    id: "issue-1",
    identifier: "ENG-1",
    title: "Test issue",
    createdAt: daysAgo(20),
    startedAt: daysAgo(15),
    completedAt: daysAgo(5),
    stateId: "done",
    stateName: "Done",
    stateType: "completed",
    labelNames: [],
    subIssues: [],
    history: [],
    ...overrides,
  };
}

describe("percentile", () => {
  it("returns nearest-rank percentile", () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 85)).toBe(9);
    expect(percentile([2, 4, 6], 50)).toBe(4);
    expect(percentile([], 85)).toBe(0);
  });
});

describe("buildStateIntervals", () => {
  it("builds intervals from state history", () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    const blockedAt = new Date("2025-01-03T00:00:00Z");
    const doneAt = new Date("2025-01-06T00:00:00Z");

    const intervals = buildStateIntervals(
      { createdAt, completedAt: doneAt, stateId: "done" },
      [
        { createdAt: blockedAt, fromStateId: "progress", toStateId: "blocked" },
        { createdAt: doneAt, fromStateId: "blocked", toStateId: "done" },
      ],
      doneAt
    );

    expect(intervals).toHaveLength(3);
    expect(intervals[1].stateId).toBe("blocked");
    expect(intervals[1].durationMs).toBe(3 * MS_PER_DAY);
  });
});

describe("computeCycleTime", () => {
  it("computes cycle time percentiles and status", () => {
    const issues = [
      makeIssue({ startedAt: daysAgo(4), completedAt: daysAgo(1) }),
      makeIssue({ id: "issue-2", startedAt: daysAgo(8), completedAt: daysAgo(2) }),
    ];

    const result = computeCycleTime(issues);
    expect(result.sampleSize).toBe(2);
    expect(result.p85).toBeGreaterThan(0);
    expect(["green", "yellow", "red"]).toContain(result.status);
  });
});

describe("computeLeadTime", () => {
  it("computes lead time from created to completed", () => {
    const result = computeLeadTime([makeIssue()]);
    expect(result.sampleSize).toBe(1);
    expect(result.p85).toBeCloseTo(15, 0);
  });
});

describe("computeBlockedTimeRatio", () => {
  it("computes aggregate blocked time ratio", () => {
    const createdAt = new Date("2025-01-01T00:00:00Z");
    const blockedAt = new Date("2025-01-06T00:00:00Z");
    const doneAt = new Date("2025-01-11T00:00:00Z");

    const issue = makeIssue({
      createdAt,
      completedAt: doneAt,
      history: [{ createdAt: blockedAt, fromStateId: "progress", toStateId: "blocked" }],
    });

    const result = computeBlockedTimeRatio(
      [issue],
      [
        { id: "progress", name: "In Progress", type: "started" },
        { id: "blocked", name: "Blocked", type: "started" },
      ],
      "Blocked",
      doneAt
    );

    expect(result.ratio).toBeCloseTo(50, 0);
    expect(result.issueCount).toBe(1);
  });
});

describe("computeWipAdherence", () => {
  it("computes utilization against wip limit", () => {
    const inProgress = [
      makeIssue({ id: "1", completedAt: null, stateType: "started" }),
      makeIssue({ id: "2", completedAt: null, stateType: "started" }),
    ];

    const result = computeWipAdherence(inProgress, 5);
    expect(result.currentWip).toBe(2);
    expect(result.utilization).toBe(40);
    expect(result.status).toBe("green");
  });
});

describe("computePcv", () => {
  it("computes checklist completion from sub-issues", () => {
    const issue = makeIssue({
      subIssues: [
        { id: "sub-1", completedAt: daysAgo(1) },
        { id: "sub-2", completedAt: null },
        { id: "sub-3", completedAt: daysAgo(2) },
      ],
    });

    const result = computePcv([issue]);
    expect(result.compliance).toBeCloseTo(66.7, 0);
    expect(result.parentIssueCount).toBe(1);
  });
});

describe("computeInnovationIndex", () => {
  it("counts innovation-labelled completed issues", () => {
    const from = daysAgo(30);
    const to = new Date();
    const issues = [
      makeIssue({ labelNames: ["improvement"], completedAt: daysAgo(10) }),
      makeIssue({ id: "issue-2", labelNames: ["bug"], completedAt: daysAgo(8) }),
    ];

    const result = computeInnovationIndex(issues, ["improvement"], from, to);
    expect(result.countInPeriod).toBe(1);
    expect(Object.keys(result.perMonth).length).toBeGreaterThan(0);
  });
});
