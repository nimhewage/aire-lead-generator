import { NextResponse } from "next/server";
import {
  getActiveCampaign,
  inventoryForCampaign,
} from "@/lib/campaigns";
import { listLeadsForCampaign } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const campaign = await getActiveCampaign();
  if (!campaign) {
    return NextResponse.json({ leads: [], inventory: null });
  }
  const [inventory, leads] = await Promise.all([
    inventoryForCampaign(campaign),
    listLeadsForCampaign(campaign),
  ]);

  return NextResponse.json({
    leads,
    inventory,
    campaignId: campaign.id,
    market: {
      primaryCity: campaign.market.primaryCity,
      country: campaign.market.country,
      name: campaign.name,
    },
    storage: inventory.source,
  });
}
