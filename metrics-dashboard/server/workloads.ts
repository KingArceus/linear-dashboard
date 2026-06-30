import { getLinearClient } from "./linearClient.js";
import type { WorkloadEntry, WorkloadsResult } from "./types.js";
import { paginateConnection } from "./utils.js";

const USER_LINE_PATTERN = /<user\s+id="([^"]*)">([^<]*)<\/user>\s*-\s*(\d+)/;
const PLAIN_LINE_PATTERN = /^(.+?)\s*-\s*(\d+)$/;

export function parseWorkloadsContent(content: string): WorkloadEntry[] {
  const entries: WorkloadEntry[] = [];

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const userMatch = trimmed.match(USER_LINE_PATTERN);
    if (userMatch) {
      entries.push({
        userId: userMatch[1],
        name: userMatch[2].trim(),
        limit: Number(userMatch[3]),
      });
      continue;
    }

    const plainMatch = trimmed.match(PLAIN_LINE_PATTERN);
    if (plainMatch) {
      entries.push({
        name: plainMatch[1].trim(),
        limit: Number(plainMatch[2]),
      });
    }
  }

  return entries;
}

export function totalWorkloadLimit(entries: WorkloadEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.limit, 0);
}

export async function fetchWorkloads(documentTitle: string): Promise<WorkloadsResult> {
  const client = getLinearClient();
  const connection = await client.documents({ first: 50 });
  await paginateConnection(connection);

  const document = connection.nodes.find(doc => doc.title === documentTitle);
  if (!document) {
    return {
      source: "config",
      documentTitle,
      entries: [],
      totalLimit: 0,
    };
  }

  const entries = parseWorkloadsContent(document.content ?? "");

  return {
    source: entries.length > 0 ? "document" : "config",
    documentTitle: document.title,
    documentUrl: document.url,
    entries,
    totalLimit: totalWorkloadLimit(entries),
  };
}
