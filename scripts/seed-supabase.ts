/**
 * Seed Supabase with local campaign JSON + lead CSVs.
 *
 *   npx tsx scripts/seed-supabase.ts
 */
import fs from "fs";
import path from "path";
import {
  activateCampaign,
  parseCsv,
  saveCampaign,
  upsertLeads,
} from "../lib/store";
import type { CampaignConfig } from "../lib/types";

const ROOT = process.cwd();
const CAMPAIGNS = path.join(ROOT, "data/campaigns");
const LEADS = path.join(ROOT, "data/leads");

const LEAD_FILES: { campaignId: string; pipeline: string; files: string[] }[] =
  [
    {
      campaignId: "dubai-aire",
      pipeline: "dubai",
      files: ["leads-dubai-osint.csv", "leads-dubai.csv"],
    },
    {
      campaignId: "sydney-aire",
      pipeline: "sydney",
      files: ["leads-sydney.csv"],
    },
    {
      campaignId: "melbourne-aire",
      pipeline: "melbourne",
      files: ["leads-melbourne.csv"],
    },
    {
      campaignId: "brisbane-aire",
      pipeline: "brisbane",
      files: ["leads-brisbane.csv"],
    },
  ];

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY required in .env.local");
  }

  const campaignFiles = fs
    .readdirSync(CAMPAIGNS)
    .filter((f) => f.endsWith(".json"));

  for (const file of campaignFiles) {
    const config = JSON.parse(
      fs.readFileSync(path.join(CAMPAIGNS, file), "utf-8")
    ) as CampaignConfig;
    config.runtime = {
      ...config.runtime,
      outputDir: "data/leads",
      agentworksRoot: config.runtime?.agentworksRoot || "",
    };
    await saveCampaign(config);
    console.log(`campaign upserted: ${config.id}`);
  }

  for (const entry of LEAD_FILES) {
    let rows: Record<string, string>[] = [];
    for (const file of entry.files) {
      const full = path.join(LEADS, file);
      if (!fs.existsSync(full)) continue;
      rows = parseCsv(fs.readFileSync(full, "utf-8"));
      console.log(`loaded ${rows.length} rows from ${file}`);
      break; // prefer first existing (osint over base for dubai)
    }
    if (!rows.length) {
      console.warn(`no leads for ${entry.campaignId}`);
      continue;
    }
    const written = await upsertLeads(
      entry.campaignId,
      entry.pipeline,
      rows
    );
    console.log(`leads upserted: ${entry.campaignId} → ${written}`);
  }

  await activateCampaign("dubai-aire");
  console.log("active campaign → dubai-aire");
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
