import type { Issue } from "@linear/sdk";
import { getTeamConfig } from "./config.js";
import { getLinearClient } from "./linearClient.js";
import type { IssueSnapshot, MetricsInput, StateHistoryEntry, WorkflowStateSnapshot } from "./types.js";
import { mapInBatches, paginateConnection } from "./utils.js";
import { fetchWorkloads } from "./workloads.js";
async function fetchIssueHistory(issue: Issue): Promise<StateHistoryEntry[]> {
  const historyConnection = await issue.history({ first: 100 });
  await paginateConnection(historyConnection);

  return historyConnection.nodes.map(entry => ({
    createdAt: entry.createdAt,
    fromStateId: entry.fromStateId,
    toStateId: entry.toStateId,
  }));
}

async function fetchIssueLabels(issue: Issue): Promise<string[]> {
  const labelsConnection = await issue.labels();
  await paginateConnection(labelsConnection);
  return labelsConnection.nodes.map(label => label.name);
}

async function fetchIssueChildren(issue: Issue): Promise<IssueSnapshot["subIssues"]> {
  const childrenConnection = await issue.children();
  await paginateConnection(childrenConnection);

  return childrenConnection.nodes.map(child => ({
    id: child.id,
    completedAt: child.completedAt,
  }));
}

async function toIssueSnapshot(
  issue: Issue,
  stateMap: Map<string, WorkflowStateSnapshot>,
  enrich: boolean
): Promise<IssueSnapshot> {
  const stateId = issue.stateId ?? "";
  const state = stateMap.get(stateId);

  const base: IssueSnapshot = {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    createdAt: issue.createdAt,
    startedAt: issue.startedAt,
    completedAt: issue.completedAt,
    stateId,
    stateName: state?.name ?? "Unknown",
    stateType: state?.type ?? "unknown",
    labelNames: [],
    subIssues: [],
    history: [],
  };

  if (!enrich) {
    return base;
  }

  const [history, labelNames, subIssues] = await Promise.all([
    fetchIssueHistory(issue),
    fetchIssueLabels(issue),
    fetchIssueChildren(issue),
  ]);

  return {
    ...base,
    history,
    labelNames,
    subIssues,
  };
}

export async function fetchTeams(): Promise<Array<{ id: string; name: string; key: string }>> {
  const client = getLinearClient();
  const teamsConnection = await client.teams({ first: 50 });
  await paginateConnection(teamsConnection);

  return teamsConnection.nodes.map(team => ({
    id: team.id,
    name: team.name,
    key: team.key,
  }));
}

export async function fetchTeamMetricsData(
  teamId: string,
  from: Date,
  to: Date
): Promise<MetricsInput> {
  const client = getLinearClient();
  const config = getTeamConfig(teamId);
  const workloads = await fetchWorkloads(config.workloadsDocumentTitle);
  const effectiveConfig = {
    ...config,
    wipLimit: workloads.entries.length > 0 ? workloads.totalLimit : config.wipLimit,
  };

  const team = await client.team(teamId);  const statesConnection = await team.states();
  await paginateConnection(statesConnection);

  const states: WorkflowStateSnapshot[] = statesConnection.nodes.map(state => ({
    id: state.id,
    name: state.name,
    type: state.type,
  }));
  const stateMap = new Map(states.map(state => [state.id, state]));

  const issuesConnection = await team.issues({ first: 50 });
  await paginateConnection(issuesConnection);

  const allIssues = issuesConnection.nodes;
  const completedInRange = allIssues.filter(
    issue => issue.completedAt && issue.completedAt >= from && issue.completedAt <= to
  );

  const inProgressIssues = allIssues.filter(issue => {
    if (issue.completedAt || issue.canceledAt) {
      return false;
    }
    const state = stateMap.get(issue.stateId ?? "");
    return state?.type === "started";
  });

  const enrichedCompleted = await mapInBatches(completedInRange, 5, issue =>
    toIssueSnapshot(issue, stateMap, true)
  );

  const inProgressSnapshots = await mapInBatches(inProgressIssues, 10, issue =>
    toIssueSnapshot(issue, stateMap, false)
  );

  return {
    teamId,
    teamName: team.name,
    from,
    to,
    config: effectiveConfig,
    workloads,
    states,
    issues: enrichedCompleted,
    inProgressIssues: inProgressSnapshots,
  };
}