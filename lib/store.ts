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
import { getSupabaseAdmin, supabaseConfigured } from "./supabase";
import { mapLeadRow, type Lead } from "./leads";
import type { CampaignConfig, MarketTemplate } from "./types";

function ensureDirs() {
  for (const dir of [DATA_DIR, CAMPAIGNS_DIR, LEADS_DIR]) {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        /* read-only on Vercel */
      }
    }
  }
  ensureRuntimeDirs();
}

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
      outputDir: resolveOutputDir(runtime.outputDir || "data/leads"),
      models: runtime.models || {
        fast: "grok-4.20-0309-non-reasoning",
        deep: "grok-4.5",
        search: "grok-4.20-0309-non-reasoning",
      },
    },
  };
}

function campaignRow(config: CampaignConfig) {
  const normalized = normalizeCampaign(config);
  return {
    id: normalized.id,
    name: normalized.name,
    market_city: normalized.market.primaryCity,
    market_country: normalized.market.country,
    market_country_code: normalized.market.countryCode,
    pipeline: normalized.runtime.pipeline,
    config: normalized,
    updated_at: new Date().toISOString(),
  };
}

function listCampaignsFromDisk(): CampaignConfig[] {
  ensureDirs();
  if (!fs.existsSync(CAMPAIGNS_DIR)) return [];
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

export async function listCampaigns(): Promise<CampaignConfig[]> {
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    try {
      const { data, error } = await sb
        .from("campaigns")
        .select("config")
        .order("name");
      if (!error && data?.length) {
        return data.map((row) =>
          normalizeCampaign(row.config as CampaignConfig)
        );
      }
    } catch {
      /* fall through to disk */
    }
  }
  return listCampaignsFromDisk();
}

export async function getCampaign(
  id: string
): Promise<CampaignConfig | null> {
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    try {
      const { data, error } = await sb
        .from("campaigns")
        .select("config")
        .eq("id", id)
        .maybeSingle();
      if (!error && data?.config) {
        return normalizeCampaign(data.config as CampaignConfig);
      }
    } catch {
      /* fall through to disk */
    }
  }
  ensureDirs();
  const p = path.join(CAMPAIGNS_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return normalizeCampaign(JSON.parse(fs.readFileSync(p, "utf-8")));
}

export async function saveCampaign(
  config: CampaignConfig
): Promise<CampaignConfig> {
  if (!config.id) throw new Error("Campaign id is required");
  const normalized = normalizeCampaign(config);
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    const { error } = await sb
      .from("campaigns")
      .upsert(campaignRow(normalized), { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
  // Mirror to disk when writable (local / seed)
  try {
    ensureDirs();
    fs.writeFileSync(
      path.join(CAMPAIGNS_DIR, `${normalized.id}.json`),
      JSON.stringify(normalized, null, 2),
      "utf-8"
    );
  } catch {
    /* ignore on Vercel */
  }
  return normalized;
}

export async function activateCampaign(id: string): Promise<CampaignConfig> {
  const config = await getCampaign(id);
  if (!config) throw new Error(`Campaign not found: ${id}`);
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    const { error } = await sb.from("app_state").upsert({
      key: "active_campaign_id",
      value: { id },
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }
  try {
    ensureDirs();
    fs.writeFileSync(
      ACTIVE_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      "utf-8"
    );
    const aw = config.runtime?.agentworksRoot;
    if (aw && fs.existsSync(aw)) {
      const dest = path.join(aw, "config", "active-campaign.json");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, JSON.stringify(config, null, 2), "utf-8");
    }
  } catch {
    /* ignore */
  }
  return config;
}

export async function getActiveCampaign(): Promise<CampaignConfig | null> {
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    try {
      const { data } = await sb
        .from("app_state")
        .select("value")
        .eq("key", "active_campaign_id")
        .maybeSingle();
      const id = (data?.value as { id?: string } | null)?.id;
      if (id) {
        const campaign = await getCampaign(id);
        if (campaign) return campaign;
      }
    } catch {
      /* fall through to disk */
    }
  }
  ensureDirs();
  if (fs.existsSync(ACTIVE_CONFIG_PATH)) {
    return normalizeCampaign(
      JSON.parse(fs.readFileSync(ACTIVE_CONFIG_PATH, "utf-8"))
    );
  }
  const all = await listCampaigns();
  return all[0] ?? null;
}

export type Inventory = {
  file: string | null;
  leadCount: number;
  withContacts: number;
  updatedAt: string | null;
  pipeline: string;
  source: "supabase" | "csv";
};

export async function inventoryAllCampaigns(
  campaigns: CampaignConfig[]
): Promise<Record<string, Inventory>> {
  const out: Record<string, Inventory> = {};
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured() && campaigns.length) {
    try {
      const { data, error } = await sb
        .from("leads")
        .select("campaign_id, contact_1_name, updated_at");
      if (!error && data) {
        const byId = new Map<
          string,
          { leadCount: number; withContacts: number; updatedAt: string | null }
        >();
        for (const row of data) {
          const id = row.campaign_id as string;
          const cur = byId.get(id) || {
            leadCount: 0,
            withContacts: 0,
            updatedAt: null as string | null,
          };
          cur.leadCount += 1;
          if (row.contact_1_name) cur.withContacts += 1;
          const ts = row.updated_at as string | null;
          if (ts && (!cur.updatedAt || ts > cur.updatedAt)) cur.updatedAt = ts;
          byId.set(id, cur);
        }
        for (const c of campaigns) {
          const pipeline = c.runtime?.pipeline || "dubai";
          const stats = byId.get(c.id) || {
            leadCount: 0,
            withContacts: 0,
            updatedAt: null,
          };
          out[c.id] = {
            file: `supabase:leads/${c.id}`,
            leadCount: stats.leadCount,
            withContacts: stats.withContacts,
            updatedAt: stats.updatedAt,
            pipeline,
            source: "supabase",
          };
        }
        return out;
      }
    } catch {
      /* fall through to per-campaign / local */
    }
  }
  await Promise.all(
    campaigns.map(async (c) => {
      out[c.id] = await inventoryForCampaign(c);
    })
  );
  return out;
}

export async function inventoryForCampaign(
  config: CampaignConfig
): Promise<Inventory> {
  const pipeline = config.runtime?.pipeline || "dubai";
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    try {
      const { data, error } = await sb
        .from("leads")
        .select("contact_1_name, updated_at")
        .eq("campaign_id", config.id);
      if (!error && data) {
        let withContacts = 0;
        let updatedAt: string | null = null;
        for (const row of data) {
          if (row.contact_1_name) withContacts += 1;
          const ts = row.updated_at as string | null;
          if (ts && (!updatedAt || ts > updatedAt)) updatedAt = ts;
        }
        return {
          file: `supabase:leads/${config.id}`,
          leadCount: data.length,
          withContacts,
          updatedAt,
          pipeline,
          source: "supabase",
        };
      }
    } catch {
      /* fall through to CSV */
    }
  }

  // CSV fallback for local seed / offline
  const outDir = resolveOutputDir(config.runtime?.outputDir);
  const candidates = [
    path.join(outDir, `leads-${pipeline}-osint.csv`),
    path.join(outDir, `leads-${pipeline}.csv`),
    path.join(LEADS_DIR, `leads-${pipeline}-osint.csv`),
    path.join(LEADS_DIR, `leads-${pipeline}.csv`),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf-8").replace(/^\uFEFF/, "");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    let withContacts = 0;
    if (lines.length > 1) {
      const headers = lines[0].split(",").map((h) => h.trim());
      const idx = headers.findIndex((h) =>
        ["contact_1_name", "contact_1_email"].includes(h)
      );
      for (const line of lines.slice(1)) {
        if (idx < 0) break;
        // naive but ok for inventory fallback
        if (line.includes("@") || (idx >= 0 && line.split(",")[idx])) {
          withContacts += 1;
        }
      }
    }
    return {
      file,
      leadCount: Math.max(0, lines.length - 1),
      withContacts,
      updatedAt: fs.statSync(file).mtime.toISOString(),
      pipeline,
      source: "csv",
    };
  }
  return {
    file: null,
    leadCount: 0,
    withContacts: 0,
    updatedAt: null,
    pipeline,
    source: supabaseConfigured() ? "supabase" : "csv",
  };
}

export async function listLeadsForCampaign(
  config: CampaignConfig
): Promise<Lead[]> {
  const sb = getSupabaseAdmin();
  if (sb && supabaseConfigured()) {
    try {
      const { data, error } = await sb
        .from("leads")
        .select("payload, company_name, company_domain, icp_score")
        .eq("campaign_id", config.id)
        .order("icp_score", { ascending: false, nullsFirst: false })
        .limit(5000);
      if (!error && data?.length) {
        return data
          .map((row) =>
            mapLeadRow(
              (row.payload || {}) as Record<string, string>,
              config.market.primaryCity
            )
          )
          .filter((l) => l.company || l.domain);
      }
      if (!error && data) return [];
    } catch {
      /* fall through to CSV */
    }
  }

  const inventory = await inventoryForCampaign(config);
  if (!inventory.file || inventory.source !== "csv" || !fs.existsSync(inventory.file)) {
    return [];
  }
  const rows = parseCsv(fs.readFileSync(inventory.file, "utf-8"));
  return rows
    .map((r) => mapLeadRow(r, config.market.primaryCity || ""))
    .filter((l) => l.company || l.domain)
    .sort((a, b) => b.score - a.score);
}

export async function exportLeadsCsv(
  config: CampaignConfig
): Promise<{ filename: string; body: Buffer } | null> {
  const leads = await listLeadsForCampaign(config);
  if (!leads.length) {
    const inventory = await inventoryForCampaign(config);
    if (inventory.file && inventory.source === "csv" && fs.existsSync(inventory.file)) {
      return {
        filename: path.basename(inventory.file),
        body: fs.readFileSync(inventory.file),
      };
    }
    return null;
  }
  // Rebuild a useful CSV from mapped leads / payload via supabase raw
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("leads")
      .select("payload")
      .eq("campaign_id", config.id)
      .order("icp_score", { ascending: false });
    if (data?.length) {
      const rows = data.map((d) => d.payload as Record<string, string>);
      const headers = Array.from(
        rows.reduce((set, row) => {
          Object.keys(row || {}).forEach((k) => set.add(k));
          return set;
        }, new Set<string>())
      );
      const lines = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => csvEscape(String(row?.[h] ?? "")))
            .join(",")
        ),
      ];
      return {
        filename: `leads-${config.runtime.pipeline}.csv`,
        body: Buffer.from(lines.join("\n"), "utf-8"),
      };
    }
  }
  return null;
}

function csvEscape(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function parseCsv(text: string): Record<string, string>[] {
  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row;
  });
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

function baseCampaignSync(): CampaignConfig {
  const existing =
    listCampaignsFromDisk().find((c) => c.id === "dubai-aire") ||
    listCampaignsFromDisk()[0];
  if (!existing) throw new Error("No base campaign found to clone from");
  return structuredClone(existing);
}

export async function cloneCampaign(
  sourceId: string,
  opts: { id?: string; name?: string } = {}
): Promise<CampaignConfig> {
  const source = await getCampaign(sourceId);
  if (!source) throw new Error(`Campaign not found: ${sourceId}`);
  const id = opts.id || `${source.id}-copy-${Date.now().toString(36)}`;
  if (await getCampaign(id)) throw new Error(`Campaign id already exists: ${id}`);
  return saveCampaign({
    ...structuredClone(source),
    id,
    name: opts.name || `${source.name} (copy)`,
    runtime: {
      ...source.runtime,
      pipeline: slugify(id),
      agentworksRoot: source.runtime.agentworksRoot || defaultAgentworksRoot(),
      outputDir: "data/leads",
    },
  });
}

export async function createCampaignFromTemplate(
  templateId: string,
  opts: { id?: string; name?: string; activate?: boolean } = {}
): Promise<CampaignConfig> {
  const template: MarketTemplate | undefined = MARKET_TEMPLATES.find(
    (t) => t.id === templateId
  );
  if (!template) throw new Error(`Unknown market template: ${templateId}`);
  const base = (await getCampaign("dubai-aire")) || baseCampaignSync();
  const id =
    opts.id ||
    slugify(`${template.market.primaryCity}-aire`) ||
    template.id;
  if (await getCampaign(id)) {
    throw new Error(
      `Campaign "${id}" already exists — pick another id or open it from Markets`
    );
  }
  const campaign = await saveCampaign({
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
      outputDir: "data/leads",
    },
  });
  if (opts.activate !== false) await activateCampaign(campaign.id);
  return campaign;
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

/** Upsert lead rows for a campaign (used by seed script). */
export async function upsertLeads(
  campaignId: string,
  pipeline: string,
  rows: Record<string, string>[]
) {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase not configured");
  const batchSize = 200;
  let written = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize).map((row) => {
      const domain = (row.company_domain || "").trim().toLowerCase();
      return {
        campaign_id: campaignId,
        pipeline,
        company_name: row.company_name || null,
        company_domain: domain || null,
        industry: row.segment || row.industry || null,
        city: row.city || null,
        country: row.country || null,
        icp_score: row.icp_score ? Number(row.icp_score) : null,
        icp_tier: (row.icp_tier || "").toUpperCase() || null,
        contact_1_name: row.contact_1_name || null,
        contact_1_email: row.contact_1_email || null,
        primary_service:
          row.primary_service ||
          row.recommended_service ||
          row.recommended_services ||
          null,
        payload: row,
        updated_at: new Date().toISOString(),
      };
    });
    // Prefer domain-keyed upsert; rows without domain get insert-only
    const withDomain = chunk.filter((c) => c.company_domain);
    const withoutDomain = chunk.filter((c) => !c.company_domain);
    if (withDomain.length) {
      const { error } = await sb.from("leads").upsert(withDomain, {
        onConflict: "campaign_id,company_domain",
        ignoreDuplicates: false,
      });
      if (error) throw new Error(error.message);
    }
    if (withoutDomain.length) {
      const { error } = await sb.from("leads").insert(withoutDomain);
      if (error) throw new Error(error.message);
    }
    written += chunk.length;
  }
  return written;
}

export { parseCsv };
