# Linear Metrics Dashboard

Standalone web dashboard that computes Kanban flow metrics from your Linear workspace using `@linear/sdk`.

## Metrics

| Metric | Target |
|--------|--------|
| Cycle Time (P85) | ≤ 5 days |
| Lead Time (P85) | ≤ 10 days |
| Blocked Time Ratio | ≤ 10% |
| WIP Adherence | ≤ 100% |
| Process Compliance (PCV) | ≥ 90% |
| Innovation Index | ≥ 2 per quarter |

## How metrics are calculated

All metrics are computed server-side from Linear issue data fetched via `@linear/sdk`. The dashboard passes a **team**, **from** date, and **to** date to `GET /api/metrics`.

### Data scope

- **Completed-issue metrics** (Cycle Time, Lead Time, Blocked Time Ratio, PCV, Innovation Index) use issues whose `completedAt` falls within the selected date range.
- **WIP Adherence** is a **current snapshot** — it counts open issues right now and is not filtered by the date range. Its WIP limit comes from the **Workloads** Linear document when available.
- For each completed issue in range, the server also loads **issue history** (state transitions), **labels**, and **sub-issues** where needed.
- The UI defaults **From** / **To** to Monday–Friday of the previous calendar week (local time).

### Percentiles

Cycle Time and Lead Time report Average, P50, P85, and P95 using the **nearest-rank** method: values are sorted ascending and the percentile is taken at index `ceil(p × n) − 1`. The dashboard highlights **P85** for threshold coloring and rounds displayed day values **up** to 3 decimal places (e.g. `15.966`).

### Cycle Time (P85)

**Definition:** Time from when work started to when it was completed.

```
Cycle Time = completedAt − startedAt
```

Only completed issues with **both** `startedAt` and `completedAt` are included. Issues completed without ever entering a started state are excluded from the sample.

| Status | P85 |
|--------|-----|
| Green | ≤ 5 days |
| Yellow | 6–10 days |
| Red | > 10 days |

### Lead Time (P85)

**Definition:** Total elapsed time from issue creation to completion.

```
Lead Time = completedAt − createdAt
```

All completed issues in the date range are included (no `startedAt` required).

| Status | P85 |
|--------|-----|
| Green | ≤ 10 days |
| Yellow | 11–20 days |
| Red | > 20 days |

### Blocked Time Ratio

**Definition:** Share of total lead time spent in a blocked workflow state.

The server reconstructs time-in-state from **issue history**: each state change (`toStateId` + timestamp) builds intervals from `createdAt` through `completedAt`. Time spent in the workflow state whose name matches `blockedStateName` in `config.json` (default: `"Blocked"`, case-insensitive) is summed across all completed issues in range.

```
Blocked Time Ratio = (Σ blocked time) / (Σ lead time) × 100
```

Lead time per issue is `completedAt − createdAt`. The result is an **aggregate ratio** across issues, not an average of per-issue percentages.

| Status | Ratio |
|--------|-------|
| Green | ≤ 10% |
| Yellow | 11–20% |
| Red | > 20% |

### WIP Adherence

**Definition:** How full the team's WIP limit is right now.

```
WIP Adherence = (current WIP / WIP limit) × 100
```

- **Current WIP** — count of open issues (not completed or canceled) in a workflow state with `type === "started"`.
- **WIP limit** — sum of per-person limits from the Linear **Workloads** document when present; otherwise `wipLimit` from `config.json`.

| Status | Utilization |
|--------|-------------|
| Green | ≤ 100% |
| Yellow | 101–120% |
| Red | > 120% |

### Workloads document

WIP limits are read from a Linear document (default title: **Workloads**). On each metrics request the server fetches documents via `@linear/sdk`, finds the document by title, and parses its markdown content into per-person limits.

**Document format** — one entry per line:

```
<user id="uuid">display.name</user> - 3
```

Plain text is also supported:

```
alice - 2
```

The dashboard shows a **Workloads** table with each person’s limit and the team total. That total becomes the WIP limit for WIP Adherence. If the document is missing or has no valid lines, the server falls back to `wipLimit` in `config.json`.

Configure the document title with `workloadsDocumentTitle` in `config.json` (default: `"Workloads"`).

### Process Compliance (PCV)

**Definition:** Percentage of completed checklist items across parent issues.

Linear has no built-in required-checklist field. PCV treats **sub-issues** on a parent issue as checklist items:

```
PCV = (completed sub-issues / total sub-issues) × 100
```

Only parent issues with at least one sub-issue are counted. A sub-issue counts as completed when it has a `completedAt` timestamp. If no sub-issues exist in the sample, compliance defaults to 100%.

| Status | Compliance |
|--------|------------|
| Green | ≥ 90% |
| Yellow | 75–89% |
| Red | < 75% |

### Innovation Index

**Definition:** Number of completed improvement initiatives in the reporting period.

An issue counts if it was **completed in the date range** and carries a label whose name matches any entry in `innovationLabels` from `config.json` (case-insensitive; defaults include `improvement`, `innovation`, `automation`, etc.).

The dashboard shows counts **per month** and **per quarter**. Threshold status is based on the **average count per quarter** across quarters touched by the selected range (rounded to the nearest integer).

| Status | Avg per quarter |
|--------|-----------------|
| Green | ≥ 2 |
| Yellow | 1 |
| Red | 0 |

## Prerequisites

- Node.js 18+
- A [Linear API key](https://linear.app/settings/api)

## Setup

```bash
cd metrics-dashboard
cp .env.example .env
# Edit .env and set LINEAR_API_KEY
npm install
```

### Configuration

Edit [`config.json`](./config.json) to customize per-team settings:

- `workloadsDocumentTitle` — Linear document title for per-person WIP limits (default: `"Workloads"`)
- `wipLimit` — fallback team WIP limit when the Workloads document is missing or empty
- `blockedStateName` — workflow state name for blocked time (default: `"Blocked"`)
- `innovationLabels` — label names that count as improvement initiatives
- `pcvMode` — `"sub-issues"` (checklist items = sub-issues on parent issues)

Override per team under `teams.<teamId>`.

## Development

Runs the API server (port 3001) and Vite dev server (port 5173) together:

```bash
npm run dev
```

Open http://localhost:5173

## Production build

```bash
npm run build
npm start
```

Serves the built UI and API from port 3001.

## Tests

```bash
npm test
```

## API

- `GET /api/teams` — list teams (`id`, `name`, `key`)
- `GET /api/metrics?teamId=<id>&from=<ISO date>&to=<ISO date>` — computed metrics JSON, including a `workloads` object:

```json
{
  "workloads": {
    "source": "document",
    "documentTitle": "Workloads",
    "documentUrl": "https://linear.app/.../document/workloads-...",
    "entries": [{ "userId": "...", "name": "alice", "limit": 3 }],
    "totalLimit": 3
  }
}
```

When `source` is `"config"`, the Workloads document was not found or had no parseable entries and `wipLimit` from `config.json` was used instead.

## Architecture

- **Server** (`server/`) — Express API, Linear data fetch (`fetch.ts`), Workloads document parsing (`workloads.ts`), pure metric functions
- **Web** (`web/`) — React + Vite dashboard with threshold-colored metric cards, a Workloads panel, and charts

The Linear API key stays on the server and is never sent to the browser.
