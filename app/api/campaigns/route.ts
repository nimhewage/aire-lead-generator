import { NextRequest, NextResponse } from "next/server";
import {
  activateCampaign,
  cloneCampaign,
  createCampaignFromTemplate,
  getActiveCampaign,
  inventoryForCampaign,
  listCampaigns,
  listMarketTemplates,
  saveCampaign,
} from "@/lib/campaigns";
import type { CampaignConfig } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const campaigns = listCampaigns();
  const active = getActiveCampaign();
  const inventories: Record<string, ReturnType<typeof inventoryForCampaign>> =
    {};
  for (const c of campaigns) {
    inventories[c.id] = inventoryForCampaign(c);
  }
  return NextResponse.json({
    campaigns,
    activeId: active?.id ?? null,
    inventory: active ? inventories[active.id] ?? null : null,
    inventories,
    templates: listMarketTemplates(),
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as CampaignConfig;
    const saved = saveCampaign(body);
    activateCampaign(saved.id);
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
      const campaign = activateCampaign(body.id);
      return NextResponse.json({ campaign });
    }

    if (body.action === "clone" && body.id) {
      const campaign = cloneCampaign(body.id, {
        id: body.newId,
        name: body.name,
      });
      if (body.activate) activateCampaign(campaign.id);
      return NextResponse.json({ campaign });
    }

    if (body.action === "createFromTemplate" && body.templateId) {
      const campaign = createCampaignFromTemplate(body.templateId, {
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
