import fs from "fs";
import path from "path";
import {
  ACTIVE_CONFIG_PATH,
  CAMPAIGNS_DIR,
  DATA_DIR,
  LEADS_DIR,
  defaultAgentworksRoot,
  ensureRuntimeDirs,
  resolveOutputDir,
} from "./paths";
import {
  LOCATION_AWARE_ANGLES,
  MARKET_TEMPLATES,
  slugify,
} from "./market-templates";
import type { CampaignConfig, MarketTemplate } from "./types";

function ensureDirs() {
  for (const dir of [DATA_DIR, CAMPAIGNS_DIR, LEADS_DIR]) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // read-only on Vercel — campaigns/leads are committed
      }
    }
  }
  ensureRuntimeDirs();
}

/** Backfill newer optional fields so older campaign JSON still loads. */
export function normalizeCampaign(raw: CampaignConfig): CampaignConfig {
  const market = raw.market || ({} as CampaignConfig["market"]);
  const runtime = raw.runtime || ({} as CampaignConfig["runtime"]);
  return {
    ...raw,
    market: {
      region: market.region || "",
      country: market.country || market.region || "",
      countryCode: market.countryCode || "",
      primaryCity: market.primaryCity || "",
      cities: market.cities?.length
        ? market.cities
        : [market.primaryCity].filter(Boolean),
      language: market.language || "en",
      locationPhrase:
        market.locationPhrase ||
        [market.primaryCity, market.region].filter(Boolean).join(" / "),
      districtLabel:
        market.districtLabel ||
        "district, free zone, or city if known, else empty string",
      districts: market.districts || [],
      adjacentMarkets: market.adjacentMarkets || [],
      timezone: market.timezone,
    },
    icp: {
      ...raw.icp,
      excludeDomains: raw.icp?.excludeDomains || [],
    },
    discovery: {
      ...raw.discovery,
      seedDomains: raw.discovery?.seedDomains || [],
      angles: raw.discovery?.angles?.length
        ? raw.discovery.angles
        : LOCATION_AWARE_ANGLES,
    },
    runtime: {
      ...runtime,
      pipeline: runtime.pipeline || raw.id || "default",
      agentworksRoot: runtime.agentworksRoot || defaultAgentworksRoot(),
      outputDir: resolveOutputDir(runtime.outputDir),
      models: runtime.models || {
        fast: "grok-4.20-0309-non-reasoning",
        deep: "grok-4.5",
        search: "grok-4.20-0309-non-reasoning",
      },
    },
  };
}

export function listCampaigns(): CampaignConfig[] {
  ensureDirs();
  return fs
    .readdirSync(CAMPAIGNS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) =>
      normalizeCampaign(
        JSON.parse(fs.readFileSync(path.join(CAMPAIGNS_DIR, f), "utf-8"))
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCampaign(id: string): CampaignConfig | null {
  ensureDirs();
  const p = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return normalizeCampaign(JSON.parse(fs.readFileSync(p, "utf-8")));
}

export function saveCampaign(config: CampaignConfig): CampaignConfig {
  ensureDirs();
  if (!config.id) throw new Error("Campaign id is required");
  const normalized = normalizeCampaign(config);
  const p = path.join(CAMPAIGNS_DIR, `${normalized.id}.json`);
  fs.writeFileSync(p, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}

export function activateCampaign(id: string): CampaignConfig {
  const config = getCampaign(id);
  if (!config) throw new Error(`Campaign not found: ${id}`);
  ensureDirs();
  fs.writeFileSync(ACTIVE_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  const aw = config.runtime?.agentworksRoot;
  if (aw && fs.existsSync(aw)) {
    const dest = path.join(aw, "config", "active-campaign.json");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(config, null, 2), "utf-8");
  }
  return config;
}

export function getActiveCampaign(): CampaignConfig | null {
  ensureDirs();
  if (fs.existsSync(ACTIVE_CONFIG_PATH)) {
    return normalizeCampaign(
      JSON.parse(fs.readFileSync(ACTIVE_CONFIG_PATH, "utf-8"))
    );
  }
  const all = listCampaigns();
  return all[0] ?? null;
}

function baseCampaign(): CampaignConfig {
  const existing = getCampaign("dubai-aire") || listCampaigns()[0];
  if (!existing) {
    throw new Error("No base campaign found to clone from");
  }
  return structuredClone(existing);
}

export function cloneCampaign(
  sourceId: string,
  opts: { id?: string; name?: string } = {}
): CampaignConfig {
  const source = getCampaign(sourceId);
  if (!source) throw new Error(`Campaign not found: ${sourceId}`);
  const id = opts.id || `${source.id}-copy-${Date.now().toString(36)}`;
  if (getCampaign(id)) throw new Error(`Campaign id already exists: ${id}`);
  const clone: CampaignConfig = {
    ...structuredClone(source),
    id,
    name: opts.name || `${source.name} (copy)`,
    runtime: {
      ...source.runtime,
      pipeline: slugify(id),
      agentworksRoot: source.runtime.agentworksRoot || defaultAgentworksRoot(),
      outputDir: source.runtime.outputDir || LEADS_DIR,
    },
  };
  return saveCampaign(clone);
}

export function createCampaignFromTemplate(
  templateId: string,
  opts: { id?: string; name?: string; activate?: boolean } = {}
): CampaignConfig {
  const template: MarketTemplate | undefined = MARKET_TEMPLATES.find(
    (t) => t.id === templateId
  );
  if (!template) throw new Error(`Unknown market template: ${templateId}`);

  const base = baseCampaign();
  const id =
    opts.id ||
    slugify(`${template.market.primaryCity}-aire`) ||
    template.id;
  if (getCampaign(id)) {
    throw new Error(
      `Campaign "${id}" already exists — pick another id or open it from Markets`
    );
  }

  const campaign: CampaignConfig = {
    ...base,
    id,
    name: opts.name || `AIRE · ${template.name}`,
    market: structuredClone(template.market),
    icp: {
      ...base.icp,
      demandDrivers: [...template.demandDrivers],
      excludeDomains: base.icp.excludeDomains || [],
    },
    discovery: {
      ...base.discovery,
      angles: structuredClone(LOCATION_AWARE_ANGLES),
      seedDomains: [],
    },
    runtime: {
      ...base.runtime,
      pipeline: slugify(template.market.primaryCity.toLowerCase()),
      agentworksRoot: base.runtime.agentworksRoot || defaultAgentworksRoot(),
      outputDir: base.runtime.outputDir || LEADS_DIR,
    },
  };

  const saved = saveCampaign(campaign);
  if (opts.activate !== false) activateCampaign(saved.id);
  return saved;
}

export function listMarketTemplates() {
  return MARKET_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    primaryCity: t.market.primaryCity,
    country: t.market.country,
    countryCode: t.market.countryCode,
    cities: t.market.cities,
  }));
}

function countCsvContacts(raw: string): { leadCount: number; withContacts: number } {
  const text = raw.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { leadCount: 0, withContacts: 0 };

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const idx = headers.findIndex((h) =>
    ["contact_1_name", "contact_name", "email", "contact_1_email"].includes(h)
  );
  let withContacts = 0;
  for (const line of lines.slice(1)) {
    if (idx < 0) break;
    const cols = splitCsvLine(line);
    if ((cols[idx] || "").trim()) withContacts += 1;
  }
  return { leadCount: lines.length - 1, withContacts };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function inventoryForCampaign(config: CampaignConfig) {
  const outDir = resolveOutputDir(config.runtime?.outputDir);
  const pipeline = config.runtime?.pipeline || "dubai";
  const awRoot = config.runtime?.agentworksRoot || defaultAgentworksRoot();
  const candidates = [
    path.join(outDir, `leads-${pipeline}-osint.csv`),
    path.join(outDir, `leads-${pipeline}.csv`),
    path.join(LEADS_DIR, `leads-${pipeline}-osint.csv`),
    path.join(LEADS_DIR, `leads-${pipeline}.csv`),
  ];
  if (awRoot) {
    const awData = path.resolve(awRoot, "../webapp/data/agentworks");
    const awOutput = path.resolve(awRoot, "output");
    candidates.push(
      path.join(awData, `leads-${pipeline}-osint.csv`),
      path.join(awData, `leads-${pipeline}.csv`),
      path.join(awOutput, `leads-${pipeline}-osint.csv`),
      path.join(awOutput, `leads-${pipeline}.csv`)
    );
  }
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf-8");
    const { leadCount, withContacts } = countCsvContacts(raw);
    const stat = fs.statSync(file);
    return {
      file,
      leadCount,
      withContacts,
      updatedAt: stat.mtime.toISOString(),
      pipeline,
    };
  }
  return {
    file: null,
    leadCount: 0,
    withContacts: 0,
    updatedAt: null,
    pipeline,
  };
}

/** Ensure historical AU lead CSVs are available under the campaign output dir. */
export function importLegacyLeadFile(
  pipeline: string,
  sourcePath: string
): string {
  ensureDirs();
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Lead file not found: ${sourcePath}`);
  }
  const dest = path.join(LEADS_DIR, `leads-${pipeline}.csv`);
  let raw = fs.readFileSync(sourcePath, "utf-8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  fs.writeFileSync(dest, raw, "utf-8");
  return dest;
}
