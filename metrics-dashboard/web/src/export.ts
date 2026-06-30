import type { MetricsResult } from "./types.js";
import { formatPercentileDays, roundUpTo3Decimals } from "./format.js";

export type ExportFormat = "csv" | "markdown";

function formatPercentileValue(value: number): string {
  return roundUpTo3Decimals(value).toFixed(3);
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(cell => escapeCsv(String(cell))).join(",");
}

function formatIsoDate(iso: string): string {
  return iso.slice(0, 10);
}

export function metricsToCsv(metrics: MetricsResult): string {
  const lines: string[] = [];

  lines.push(csvRow(["field", "value"]));
  lines.push(csvRow(["team", metrics.teamName]));
  lines.push(csvRow(["team_id", metrics.teamId]));
  lines.push(csvRow(["from", formatIsoDate(metrics.from)]));
  lines.push(csvRow(["to", formatIsoDate(metrics.to)]));
  lines.push("");

  lines.push(
    csvRow([
      "metric",
      "primary_value",
      "status",
      "target",
      "average",
      "p50",
      "p85",
      "p95",
      "sample_size",
      "extra",
    ])
  );

  lines.push(
    csvRow([
      "Cycle Time (P85)",
      formatPercentileDays(metrics.cycleTime.p85),
      metrics.cycleTime.status,
      "≤ 5 days",
      formatPercentileValue(metrics.cycleTime.average),
      formatPercentileValue(metrics.cycleTime.p50),
      formatPercentileValue(metrics.cycleTime.p85),
      formatPercentileValue(metrics.cycleTime.p95),
      metrics.cycleTime.sampleSize,
      "",
    ])
  );

  lines.push(
    csvRow([
      "Lead Time (P85)",
      formatPercentileDays(metrics.leadTime.p85),
      metrics.leadTime.status,
      "≤ 10 days",
      formatPercentileValue(metrics.leadTime.average),
      formatPercentileValue(metrics.leadTime.p50),
      formatPercentileValue(metrics.leadTime.p85),
      formatPercentileValue(metrics.leadTime.p95),
      metrics.leadTime.sampleSize,
      "",
    ])
  );

  lines.push(
    csvRow([
      "Blocked Time Ratio",
      `${metrics.blockedTimeRatio.ratio.toFixed(1)}%`,
      metrics.blockedTimeRatio.status,
      "≤ 10%",
      "",
      "",
      "",
      "",
      metrics.blockedTimeRatio.issueCount,
      `blocked_days=${metrics.blockedTimeRatio.totalBlockedDays.toFixed(1)}; lead_days=${metrics.blockedTimeRatio.totalLeadDays.toFixed(1)}`,
    ])
  );

  lines.push(
    csvRow([
      "WIP Adherence",
      `${metrics.wipAdherence.utilization.toFixed(1)}%`,
      metrics.wipAdherence.status,
      "≤ 100%",
      "",
      "",
      "",
      "",
      metrics.wipAdherence.currentWip,
      `wip_limit=${metrics.wipAdherence.wipLimit}`,
    ])
  );

  lines.push(
    csvRow([
      "Process Compliance (PCV)",
      `${metrics.pcv.compliance.toFixed(1)}%`,
      metrics.pcv.status,
      "≥ 90%",
      "",
      "",
      "",
      "",
      metrics.pcv.parentIssueCount,
      `completed=${metrics.pcv.completedChecklistItems}; total=${metrics.pcv.totalChecklistItems}`,
    ])
  );

  lines.push(
    csvRow([
      "Innovation Index",
      String(metrics.innovationIndex.countInPeriod),
      metrics.innovationIndex.status,
      "≥ 2 per quarter",
      "",
      "",
      "",
      "",
      metrics.innovationIndex.countInPeriod,
      "",
    ])
  );

  lines.push("");
  lines.push(csvRow(["period", "innovation_count"]));
  for (const [month, count] of Object.entries(metrics.innovationIndex.perMonth).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    lines.push(csvRow([month, count]));
  }

  lines.push("");
  lines.push(csvRow(["quarter", "innovation_count"]));
  for (const [quarter, count] of Object.entries(metrics.innovationIndex.perQuarter).sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    lines.push(csvRow([quarter, count]));
  }

  return lines.join("\n");
}

export function metricsToMarkdown(metrics: MetricsResult): string {
  const from = formatIsoDate(metrics.from);
  const to = formatIsoDate(metrics.to);

  const lines: string[] = [
    `# Linear Metrics Report`,
    ``,
    `**Team:** ${metrics.teamName}  `,
    `**Period:** ${from} to ${to}  `,
    `**Generated:** ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value | Status | Target |`,
    `|--------|-------|--------|--------|`,
    `| Cycle Time (P85) | ${formatPercentileDays(metrics.cycleTime.p85)} | ${metrics.cycleTime.status} | ≤ 5 days |`,
    `| Lead Time (P85) | ${formatPercentileDays(metrics.leadTime.p85)} | ${metrics.leadTime.status} | ≤ 10 days |`,
    `| Blocked Time Ratio | ${metrics.blockedTimeRatio.ratio.toFixed(1)}% | ${metrics.blockedTimeRatio.status} | ≤ 10% |`,
    `| WIP Adherence | ${metrics.wipAdherence.utilization.toFixed(1)}% | ${metrics.wipAdherence.status} | ≤ 100% |`,
    `| Process Compliance (PCV) | ${metrics.pcv.compliance.toFixed(1)}% | ${metrics.pcv.status} | ≥ 90% |`,
    `| Innovation Index | ${metrics.innovationIndex.countInPeriod} in period | ${metrics.innovationIndex.status} | ≥ 2 per quarter |`,
    ``,
    `## Cycle Time`,
    ``,
    `| Stat | Days |`,
    `|------|------|`,
    `| Average | ${formatPercentileValue(metrics.cycleTime.average)} |`,
    `| P50 | ${formatPercentileValue(metrics.cycleTime.p50)} |`,
    `| P85 | ${formatPercentileValue(metrics.cycleTime.p85)} |`,
    `| P95 | ${formatPercentileValue(metrics.cycleTime.p95)} |`,
    `| Sample size | ${metrics.cycleTime.sampleSize} |`,
    ``,
    `## Lead Time`,
    ``,
    `| Stat | Days |`,
    `|------|------|`,
    `| Average | ${formatPercentileValue(metrics.leadTime.average)} |`,
    `| P50 | ${formatPercentileValue(metrics.leadTime.p50)} |`,
    `| P85 | ${formatPercentileValue(metrics.leadTime.p85)} |`,
    `| P95 | ${formatPercentileValue(metrics.leadTime.p95)} |`,
    `| Sample size | ${metrics.leadTime.sampleSize} |`,
    ``,
    `## Blocked Time Ratio`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Ratio | ${metrics.blockedTimeRatio.ratio.toFixed(1)}% |`,
    `| Total blocked | ${metrics.blockedTimeRatio.totalBlockedDays.toFixed(1)} days |`,
    `| Total lead | ${metrics.blockedTimeRatio.totalLeadDays.toFixed(1)} days |`,
    `| Issues analyzed | ${metrics.blockedTimeRatio.issueCount} |`,
    ``,
    `## WIP Adherence`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Current WIP | ${metrics.wipAdherence.currentWip} |`,
    `| WIP limit | ${metrics.wipAdherence.wipLimit} |`,
    `| Utilization | ${metrics.wipAdherence.utilization.toFixed(1)}% |`,
    ``,
    `## Process Compliance (PCV)`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Compliance | ${metrics.pcv.compliance.toFixed(1)}% |`,
    `| Completed checklist items | ${metrics.pcv.completedChecklistItems} |`,
    `| Total checklist items | ${metrics.pcv.totalChecklistItems} |`,
    `| Parent issues | ${metrics.pcv.parentIssueCount} |`,
    ``,
    `## Innovation Index`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| Count in period | ${metrics.innovationIndex.countInPeriod} |`,
  ];

  const months = Object.entries(metrics.innovationIndex.perMonth).sort(([a], [b]) => a.localeCompare(b));
  if (months.length > 0) {
    lines.push(``, `### By Month`, ``, `| Month | Count |`, `|-------|-------|`);
    for (const [month, count] of months) {
      lines.push(`| ${month} | ${count} |`);
    }
  }

  const quarters = Object.entries(metrics.innovationIndex.perQuarter).sort(([a], [b]) => a.localeCompare(b));
  if (quarters.length > 0) {
    lines.push(``, `### By Quarter`, ``, `| Quarter | Count |`, `|---------|-------|`);
    for (const [quarter, count] of quarters) {
      lines.push(`| ${quarter} | ${count} |`);
    }
  }

  return lines.join("\n");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function downloadMetrics(metrics: MetricsResult, format: ExportFormat): void {
  const content = format === "csv" ? metricsToCsv(metrics) : metricsToMarkdown(metrics);
  const mimeType = format === "csv" ? "text/csv;charset=utf-8" : "text/markdown;charset=utf-8";
  const extension = format === "csv" ? "csv" : "md";
  const from = formatIsoDate(metrics.from);
  const to = formatIsoDate(metrics.to);
  const filename = `linear-metrics-${slugify(metrics.teamName)}-${from}-${to}.${extension}`;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
