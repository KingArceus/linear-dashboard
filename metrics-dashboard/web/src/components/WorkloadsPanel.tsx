import type { WorkloadsResult } from "../types.js";

interface WorkloadsPanelProps {
  workloads: WorkloadsResult;
}

export function WorkloadsPanel({ workloads }: WorkloadsPanelProps) {
  const sourceLabel =
    workloads.source === "document"
      ? `Linear document: ${workloads.documentTitle ?? "Workloads"}`
      : "config.json fallback";

  return (
    <section className="workloads-section">
      <div className="workloads-header">
        <h2>Workloads</h2>
        <p>
          {sourceLabel}
          {workloads.documentUrl && (
            <>
              {" "}
              ·{" "}
              <a href={workloads.documentUrl} target="_blank" rel="noreferrer">
                Open in Linear
              </a>
            </>
          )}
        </p>
      </div>

      {workloads.entries.length > 0 ? (
        <table className="workloads-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>WIP limit</th>
            </tr>
          </thead>
          <tbody>
            {workloads.entries.map(entry => (
              <tr key={entry.userId ?? entry.name}>
                <td>{entry.name}</td>
                <td>{entry.limit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Team total</td>
              <td>{workloads.totalLimit}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="workloads-empty">
          No workloads found in the &quot;{workloads.documentTitle ?? "Workloads"}&quot; document. Using
          the WIP limit from config.json.
        </p>
      )}
    </section>
  );
}
