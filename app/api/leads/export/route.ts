import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getActiveCampaign, inventoryForCampaign } from "@/lib/campaigns";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const campaign = getActiveCampaign();
  if (!campaign) {
    return NextResponse.json({ error: "No active campaign" }, { status: 404 });
  }
  const inventory = inventoryForCampaign(campaign);
  if (!inventory.file || !fs.existsSync(inventory.file)) {
    return NextResponse.json({ error: "No leads file found" }, { status: 404 });
  }
  const raw = fs.readFileSync(inventory.file);
  const base = path.basename(inventory.file);
  return new NextResponse(raw, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}"`,
      "Cache-Control": "no-store",
    },
  });
}
