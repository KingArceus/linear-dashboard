import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchMetrics, fetchTeams } from "./api.js";
import { DateRangePicker } from "./components/DateRangePicker.js";
import { ExportButton } from "./components/ExportButton.js";
import { MetricCard } from "./components/MetricCard.js";
import { TeamSelector } from "./components/TeamSelector.js";
import { WorkloadsPanel } from "./components/WorkloadsPanel.js";
import { defaultDateRangeStrings } from "../../shared/dateRange.js";
import { formatPercentileDays, roundUpTo3Decimals } from "./format.js";
import type { MetricsResult, Team } from "./types.js";

const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "#151a24",
    border: "1px solid #3a4256",
    borderRadius: "8px",
    color: "#e8eaed",
  },
  labelStyle: {
    color: "#e8eaed",
    fontWeight: 600,
    marginBottom: "0.35rem",
  },
  itemStyle: {
    color: "#c5c9d0",
  },
};

const initialDateRange = defaultDateRangeStrings();

function formatDays(value: number): string {
  return `${value.toFixed(1)} days`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState("");
  const [from, setFrom] = useState(initialDateRange.from);
  const [to, setTo] = useState(initialDateRange.to);
  const [metrics, setMetrics] = useState<MetricsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeams()
      .then(fetchedTeams => {
        setTeams(fetchedTeams);
        if (fetchedTeams.length > 0) {
          setTeamId(fetchedTeams[0].id);
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : "Failed to load teams"));
  }, []);

  const loadMetrics = useCallback(async () => {
    if (!teamId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchMetrics(teamId, from, to);
      setMetrics(result);
    } catch (err) {
      setMetrics(null);
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [teamId, from, to]);

  useEffect(() => {
    if (teamId) {
      void loadMetrics();
    }
  }, [teamId, loadMetrics]);

  const percentileChartData = metrics
    ? [
        {
          metric: "Cycle Time",
          P50: roundUpTo3Decimals(metrics.cycleTime.p50),
          P85: roundUpTo3Decimals(metrics.cycleTime.p85),
          P95: roundUpTo3Decimals(metrics.cycleTime.p95),
        },
        {
          metric: "Lead Time",
          P50: roundUpTo3Decimals(metrics.leadTime.p50),
          P85: roundUpTo3Decimals(metrics.leadTime.p85),
          P95: roundUpTo3Decimals(metrics.leadTime.p95),
        },
      ]
    : [];

  const innovationChartData = metrics
    ? Object.entries(metrics.innovationIndex.perMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }))
    : [];

  return (
    <div className="app">
      <header className="header">
        <h1>Linear Metrics Dashboard</h1>
        <p>Kanban flow metrics for your Linear team</p>
      </header>

      <section className="controls">
        <TeamSelector teams={teams} value={teamId} onChange={setTeamId} disabled={loading} />
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          disabled={loading}
        />
        <div className="control">
          <label>&nbsp;</label>
          <button type="button" onClick={() => void loadMetrics()} disabled={loading || !teamId}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        <ExportButton metrics={metrics} disabled={loading} />
      </section>

      {error && <div className="error-banner">{error}</div>}
      {loading && !metrics && <div className="loading">Loading metrics...</div>}

      {metrics && (
        <>
          <section className="metrics-grid">
            <MetricCard
              title="Cycle Time (P85)"
              primaryValue={formatPercentileDays(metrics.cycleTime.p85)}
              target="≤ 5 days"
              status={metrics.cycleTime.status}
              details={[
                { label: "Average", value: formatPercentileDays(metrics.cycleTime.average) },
                { label: "P50", value: formatPercentileDays(metrics.cycleTime.p50) },
                { label: "P95", value: formatPercentileDays(metrics.cycleTime.p95) },
                { label: "Sample size", value: String(metrics.cycleTime.sampleSize) },
              ]}
            />
            <MetricCard
              title="Lead Time (P85)"
              primaryValue={formatPercentileDays(metrics.leadTime.p85)}
              target="≤ 10 days"
              status={metrics.leadTime.status}
              details={[
                { label: "Average", value: formatPercentileDays(metrics.leadTime.average) },
                { label: "P50", value: formatPercentileDays(metrics.leadTime.p50) },
                { label: "P95", value: formatPercentileDays(metrics.leadTime.p95) },
                { label: "Sample size", value: String(metrics.leadTime.sampleSize) },
              ]}
            />
            <MetricCard
              title="Blocked Time Ratio"
              primaryValue={formatPercent(metrics.blockedTimeRatio.ratio)}
              target="≤ 10%"
              status={metrics.blockedTimeRatio.status}
              details={[
                { label: "Total blocked", value: formatDays(metrics.blockedTimeRatio.totalBlockedDays) },
                { label: "Total lead", value: formatDays(metrics.blockedTimeRatio.totalLeadDays) },
                { label: "Issues analyzed", value: String(metrics.blockedTimeRatio.issueCount) },
              ]}
            />
            <MetricCard
              title="WIP Adherence"
              primaryValue={formatPercent(metrics.wipAdherence.utilization)}
              target="≤ 100%"
              status={metrics.wipAdherence.status}
              details={[
                { label: "Current WIP", value: String(metrics.wipAdherence.currentWip) },
                {
                  label: "WIP limit",
                  value:
                    metrics.workloads.source === "document"
                      ? `${metrics.wipAdherence.wipLimit} (from Workloads)`
                      : String(metrics.wipAdherence.wipLimit),
                },
              ]}
            />
            <MetricCard
              title="Process Compliance (PCV)"
              primaryValue={formatPercent(metrics.pcv.compliance)}
              target="≥ 90%"
              status={metrics.pcv.status}
              details={[
                {
                  label: "Completed items",
                  value: `${metrics.pcv.completedChecklistItems} / ${metrics.pcv.totalChecklistItems}`,
                },
                { label: "Parent issues", value: String(metrics.pcv.parentIssueCount) },
              ]}
            />
            <MetricCard
              title="Innovation Index"
              primaryValue={`${metrics.innovationIndex.countInPeriod} in period`}
              target="≥ 2 per quarter"
              status={metrics.innovationIndex.status}
              details={Object.entries(metrics.innovationIndex.perQuarter)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([quarter, count]) => ({
                  label: quarter,
                  value: String(count),
                }))}
            />
          </section>

          <WorkloadsPanel workloads={metrics.workloads} />

          <section className="chart-section">
            <h2>Cycle & Lead Time Percentiles</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={percentileChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
                <XAxis dataKey="metric" stroke="#9aa0a6" />
                <YAxis stroke="#9aa0a6" tickFormatter={value => roundUpTo3Decimals(Number(value)).toFixed(3)} />
                <Tooltip
                  {...chartTooltipProps}
                  formatter={(value: number) => roundUpTo3Decimals(value).toFixed(3)}
                />
                <Legend />
                <Bar dataKey="P50" fill="#5e6ad2" />
                <Bar dataKey="P85" fill="#7ddea0" />
                <Bar dataKey="P95" fill="#e6c060" />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {innovationChartData.length > 0 && (
            <section className="chart-section">
              <h2>Innovation Index by Month</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={innovationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a3142" />
                  <XAxis dataKey="month" stroke="#9aa0a6" />
                  <YAxis stroke="#9aa0a6" allowDecimals={false} />
                  <Tooltip {...chartTooltipProps} />
                  <Bar dataKey="count" fill="#5e6ad2" name="Improvements" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}
        </>
      )}
    </div>
  );
}
