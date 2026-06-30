import type { ThresholdStatus } from "../types.js";

interface MetricCardProps {
  title: string;
  primaryValue: string;
  target: string;
  status: ThresholdStatus;
  details: Array<{ label: string; value: string }>;
}

export function MetricCard({ title, primaryValue, target, status, details }: MetricCardProps) {
  return (
    <article className={`metric-card status-${status}`}>
      <h2>
        {title}{" "}
        <span className={`status-pill ${status}`}>{status}</span>
      </h2>
      <div className="metric-primary">{primaryValue}</div>
      <div className="metric-target">Target: {target}</div>
      <div className="metric-details">
        {details.map(detail => (
          <div key={detail.label}>
            <span>{detail.label}</span>
            <span>{detail.value}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
