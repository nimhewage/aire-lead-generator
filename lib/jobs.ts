import fs from "fs";
import path from "path";
import { JOBS_DIR } from "./paths";
import type { MiningJob } from "./types";

const JOBS_FILE = path.join(JOBS_DIR, "jobs.json");

function ensure() {
  if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
}

function load(): MiningJob[] {
  ensure();
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function save(jobs: MiningJob[]) {
  ensure();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs.slice(0, 50), null, 2));
}

export function listJobs() {
  return load();
}

export function getActiveJob() {
  return load().find((j) => j.status === "running" || j.status === "queued") ?? null;
}

export function createJob(
  partial: Omit<MiningJob, "id" | "startedAt" | "logTail" | "status"> & {
    status?: MiningJob["status"];
  }
): MiningJob {
  const job: MiningJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    startedAt: new Date().toISOString(),
    logTail: [],
    status: partial.status ?? "queued",
    ...partial,
  };
  const jobs = load();
  jobs.unshift(job);
  save(jobs);
  return job;
}

export function updateJob(id: string, updates: Partial<MiningJob>) {
  const jobs = load();
  const i = jobs.findIndex((j) => j.id === id);
  if (i < 0) return null;
  jobs[i] = { ...jobs[i], ...updates };
  save(jobs);
  return jobs[i];
}

export function appendLog(id: string, line: string) {
  const jobs = load();
  const i = jobs.findIndex((j) => j.id === id);
  if (i < 0) return;
  jobs[i].logTail = [...jobs[i].logTail, line].slice(-200);
  save(jobs);
  const logPath = path.join(JOBS_DIR, `${id}.log`);
  fs.appendFileSync(logPath, `${line}\n`);
}

export function jobLogPath(id: string) {
  ensure();
  return path.join(JOBS_DIR, `${id}.log`);
}

export function refreshLogTail(id: string) {
  const logPath = path.join(JOBS_DIR, `${id}.log`);
  if (!fs.existsSync(logPath)) return;
  const tail = fs
    .readFileSync(logPath, "utf-8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-120);
  updateJob(id, { logTail: tail });
}
