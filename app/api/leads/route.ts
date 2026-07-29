import { NextResponse } from "next/server";
import fs from "fs";
import { getActiveCampaign, inventoryForCampaign } from "@/lib/campaigns";
import { mapLeadRow } from "@/lib/leads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

export async function GET() {
  const campaign = getActiveCampaign();
  if (!campaign) {
    return NextResponse.json({ leads: [], inventory: null });
  }
  const inventory = inventoryForCampaign(campaign);
  if (!inventory.file || !fs.existsSync(inventory.file)) {
    return NextResponse.json({ leads: [], inventory });
  }
  const rows = parseCsv(fs.readFileSync(inventory.file, "utf-8"));
  const leads = rows
    .map((r) => mapLeadRow(r, campaign.market.primaryCity || ""))
    .filter((l) => l.company || l.domain)
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    leads,
    inventory,
    campaignId: campaign.id,
    market: {
      primaryCity: campaign.market.primaryCity,
      country: campaign.market.country,
      name: campaign.name,
    },
  });
}
