export type ThresholdStatus = "green" | "yellow" | "red";

export interface Team {
  id: string;
  name: string;
  key: string;
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
