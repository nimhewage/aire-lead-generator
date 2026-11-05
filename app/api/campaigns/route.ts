import { NextRequest, NextResponse } from "next/server";
import {
  activateCampaign,
  cloneCampaign,
  createCampaignFromTemplate,
  getActiveCampaign,
  inventoryAllCampaigns,
  listCampaigns,
  listMarketTemplates,
  saveCampaign,
} from "@/lib/campaigns";
import type { CampaignConfig } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const campaigns = await listCampaigns();
  const [active, inventories] = await Promise.all([
    getActiveCampaign(),
    inventoryAllCampaigns(campaigns),
  ]);
  return NextResponse.json({
    campaigns,
    activeId: active?.id ?? null,
    inventory: active ? inventories[active.id] ?? null : null,
    inventories,
    templates: listMarketTemplates(),
    storage: inventories[campaigns[0]?.id || ""]?.source || "local",
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as CampaignConfig;
    const saved = await saveCampaign(body);
    await activateCampaign(saved.id);
    return NextResponse.json({ campaign: saved });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "activate" && body.id) {
      const campaign = await activateCampaign(body.id);
      return NextResponse.json({ campaign });
    }

    if (body.action === "clone" && body.id) {
      const campaign = await cloneCampaign(body.id, {
        id: body.newId,
        name: body.name,
      });
      if (body.activate) await activateCampaign(campaign.id);
      return NextResponse.json({ campaign });
    }

    if (body.action === "createFromTemplate" && body.templateId) {
      const campaign = await createCampaignFromTemplate(body.templateId, {
        id: body.id,
        name: body.name,
        activate: body.activate !== false,
      });
      return NextResponse.json({ campaign });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
