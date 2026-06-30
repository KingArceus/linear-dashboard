import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { TeamConfig } from "./types.js";

interface ConfigFile {
  defaults: TeamConfig;
  teams: Record<string, Partial<TeamConfig>>;
}

function resolveConfigPath(): string {
  const serverDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(serverDir, "..", "config.json"),
    join(serverDir, "..", "..", "config.json"),
  ];
  return candidates.find(candidate => existsSync(candidate)) ?? candidates[0];
}

const configPath = resolveConfigPath();

let cachedConfig: ConfigFile | undefined;

function loadConfigFile(): ConfigFile {
  if (!cachedConfig) {
    const raw = readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(raw) as ConfigFile;
  }
  return cachedConfig;
}

export function getTeamConfig(teamId: string): TeamConfig {
  const config = loadConfigFile();
  const teamOverrides = config.teams[teamId] ?? {};
  return {
    ...config.defaults,
    ...teamOverrides,
  };
}

export function reloadConfig(): void {
  cachedConfig = undefined;
}
