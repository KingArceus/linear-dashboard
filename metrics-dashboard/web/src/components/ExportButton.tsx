import { downloadMetrics, type ExportFormat } from "../export.js";
import type { MetricsResult } from "../types.js";

interface ExportButtonProps {
  metrics: MetricsResult | null;
  disabled?: boolean;
}

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: "csv", label: "CSV" },
  { value: "markdown", label: "Markdown" },
];

export function ExportButton({ metrics, disabled }: ExportButtonProps) {
  const isDisabled = disabled || !metrics;

  function handleDownload(format: ExportFormat) {
    if (!metrics) {
      return;
    }
    downloadMetrics(metrics, format);
  }

  return (
    <div className="control export-control">
      <label>Export</label>
      <div className={`export-dropdown${isDisabled ? " is-disabled" : ""}`}>
        <button type="button" className="export-trigger" disabled={isDisabled}>
          Download
        </button>
        <div className="export-menu-wrap">
          <ul className="export-menu" role="menu">
            {FORMATS.map(({ value, label }) => (
              <li key={value} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="export-menu-item"
                  onClick={() => handleDownload(value)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
