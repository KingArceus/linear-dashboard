export type ThresholdStatus = "green" | "yellow" | "red";

export interface SubIssueSnapshot {
  id: string;
  completedAt?: Date | null;
}

export interface IssueSnapshot {
  id: string;
  identifier: string;
  title: string;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  stateId: string;
  stateName: string;
  stateType: string;
  labelNames: string[];
  subIssues: SubIssueSnapshot[];
  history: StateHistoryEntry[];
}

export interface StateHistoryEntry {
  createdAt: Date;
  fromStateId?: string | null;
  toStateId?: string | null;
}

export interface WorkflowStateSnapshot {
  id: string;
  name: string;
  type: string;
}

export interface TeamConfig {
  blockedStateName: string;
  innovationLabels: string[];
  pcvMode: "sub-issues";
  wipLimit: number;
  workloadsDocumentTitle: string;
}

export interface WorkloadEntry {
  userId?: string;
  name: string;
  limit: number;
}

export interface WorkloadsResult {
  source: "document" | "config";
  documentTitle?: string;
  documentUrl?: string;
  entries: WorkloadEntry[];
  totalLimit: number;
}

export interface MetricsInput {
  teamId: string;
  teamName: string;
  from: Date;
  to: Date;
  config: TeamConfig;
  workloads: WorkloadsResult;
  states: WorkflowStateSnapshot[];
  issues: IssueSnapshot[];
  inProgressIssues: IssueSnapshot[];
}

export interface PercentileMetricResult {
  average: number;
  p50: number;
  p85: number;
  p95: number;
  status: ThresholdStatus;
  sampleSize: number;
  unit: "days";
}

export interface BlockedTimeRatioResult {
  ratio: number;
  status: ThresholdStatus;
  unit: "percent";
  totalBlockedDays: number;
  totalLeadDays: number;
  issueCount: number;
}

export interface WipAdherenceResult {
  currentWip: number;
  wipLimit: number;
  utilization: number;
  status: ThresholdStatus;
  unit: "percent";
}

export interface PcvResult {
  compliance: number;
  status: ThresholdStatus;
  unit: "percent";
  completedChecklistItems: number;
  totalChecklistItems: number;
  parentIssueCount: number;
}

export interface InnovationIndexResult {
  countInPeriod: number;
  perMonth: Record<string, number>;
  perQuarter: Record<string, number>;
  status: ThresholdStatus;
  unit: "count";
}

export interface MetricsResult {
  teamId: string;
  teamName: string;
  from: string;
  to: string;
  cycleTime: PercentileMetricResult;
  leadTime: PercentileMetricResult;
  blockedTimeRatio: BlockedTimeRatioResult;
  wipAdherence: WipAdherenceResult;
  workloads: WorkloadsResult;
  pcv: PcvResult;
  innovationIndex: InnovationIndexResult;
}
