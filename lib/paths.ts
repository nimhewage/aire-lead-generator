import fs from "fs";
import path from "path";

export const ROOT = process.cwd();
export const DATA_DIR = path.join(ROOT, "data");
export const CAMPAIGNS_DIR = path.join(DATA_DIR, "campaigns");
export const LEADS_DIR = path.join(DATA_DIR, "leads");

/** Writable runtime dir — /tmp on Vercel (read-only app filesystem). */
export const RUNTIME_DIR = process.env.VERCEL
  ? path.join("/tmp", "aire-lead-generator")
  : DATA_DIR;

export const JOBS_DIR = path.join(RUNTIME_DIR, "jobs");
export const ACTIVE_CONFIG_PATH = path.join(
  RUNTIME_DIR,
  "active-campaign.json"
);

export function ensureRuntimeDirs() {
  for (const dir of [RUNTIME_DIR, JOBS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function defaultAgentworksRoot() {
  return process.env.AGENTWORKS_ROOT || "";
}

export function resolveOutputDir(configured?: string) {
  if (!configured || configured === "data/leads") return LEADS_DIR;
  if (configured.startsWith("/") && !fs.existsSync(configured)) return LEADS_DIR;
  return path.isAbsolute(configured)
    ? configured
    : path.join(ROOT, configured);
}
