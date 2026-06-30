import type { MetricsResult, Team } from "./types.js";

const API_BASE = "";

export async function fetchTeams(): Promise<Team[]> {
  const response = await fetch(`${API_BASE}/api/teams`);
  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.statusText}`);
  }
  const data = (await response.json()) as { teams: Team[] };
  return data.teams;
}

export async function fetchMetrics(teamId: string, from: string, to: string): Promise<MetricsResult> {
  const params = new URLSearchParams({ teamId, from, to });
  const response = await fetch(`${API_BASE}/api/metrics?${params.toString()}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to fetch metrics: ${response.statusText}`);
  }
  return response.json() as Promise<MetricsResult>;
}
