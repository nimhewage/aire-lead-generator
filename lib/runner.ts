import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { activateCampaign, getCampaign } from "./campaigns";
import {
  appendLog,
  createJob,
  getActiveJob,
  jobLogPath,
  refreshLogTail,
  updateJob,
} from "./jobs";
import type { SwarmStage } from "./types";

function resolveCommand(
  agentworksRoot: string,
  pipeline: string,
  stage: SwarmStage,
  limit?: number
) {
  const limitArgs =
    typeof limit === "number" && limit > 0 ? ["--limit", String(limit)] : [];

  if (pipeline === "dubai") {
    const script = path.join(agentworksRoot, "scripts/run_dubai_pipeline.sh");
    if (stage === "all") return { cmd: "bash", args: [script, "all"] };
    if (stage === "preflight")
      return { cmd: "bash", args: [script, "preflight"] };
    if (stage === "discover")
      return { cmd: "bash", args: [script, "discover", ...limitArgs] };
    if (stage === "mine")
      return {
        cmd: "python3",
        args: ["-u", "scripts/mine_leads_dubai.py", ...limitArgs],
      };
    if (stage === "osint")
      return { cmd: "bash", args: [script, "osint", ...limitArgs] };
  }

  throw new Error(`Unsupported pipeline/stage: ${pipeline}/${stage}`);
}

export async function startSwarmJob(input: {
  campaignId: string;
  stage: SwarmStage;
  limit?: number;
}) {
  if (getActiveJob()) {
    throw new Error("A swarm job is already running. Wait for it to finish.");
  }

  const campaign = await getCampaign(input.campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await activateCampaign(campaign.id);

  const root = campaign.runtime.agentworksRoot;
  if (!fs.existsSync(root)) {
    throw new Error(`agentworks root not found: ${root}`);
  }

  const { cmd, args } = resolveCommand(
    root,
    campaign.runtime.pipeline,
    input.stage,
    input.limit
  );

  const job = createJob({
    campaignId: campaign.id,
    stage: input.stage,
    status: "running",
    limit: input.limit,
  });

  appendLog(job.id, `[A/RE] Campaign ${campaign.name}`);
  appendLog(job.id, `[A/RE] Stage ${input.stage}`);
  appendLog(job.id, `[A/RE] $ ${cmd} ${args.join(" ")}`);

  const logFile = jobLogPath(job.id);
  const fd = fs.openSync(logFile, "a");

  const child = spawn(cmd, args, {
    cwd: root,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      AIRE_CAMPAIGN_CONFIG: path.join(root, "config/active-campaign.json"),
      DUBAI_MODEL_FAST: campaign.runtime.models.fast,
      DUBAI_MODEL_DEEP: campaign.runtime.models.deep,
      DUBAI_MODEL_SEARCH: campaign.runtime.models.search,
    },
    stdio: ["ignore", fd, fd],
  });

  updateJob(job.id, { pid: child.pid });

  child.on("error", (err) => {
    appendLog(job.id, `[A/RE] spawn error: ${err.message}`);
    updateJob(job.id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      error: err.message,
    });
    try {
      fs.closeSync(fd);
    } catch {
      /* ignore */
    }
  });

  child.on("close", (code) => {
    try {
      fs.closeSync(fd);
    } catch {
      /* ignore */
    }
    refreshLogTail(job.id);
    if (code === 0) {
      appendLog(job.id, "[A/RE] Swarm completed");
      updateJob(job.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
    } else {
      const error = `Process exited with code ${code ?? "unknown"}`;
      appendLog(job.id, `[A/RE] ${error}`);
      updateJob(job.id, {
        status: "failed",
        completedAt: new Date().toISOString(),
        error,
      });
    }
  });

  return job;
}
