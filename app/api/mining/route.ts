import { NextResponse } from "next/server";
import { getActiveCampaign, inventoryForCampaign } from "@/lib/campaigns";
import { getActiveJob, listJobs, refreshLogTail } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const active = getActiveJob();
  if (active) refreshLogTail(active.id);
  const campaign = await getActiveCampaign();
  return NextResponse.json({
    campaign,
    activeJob: getActiveJob(),
    recentJobs: listJobs().slice(0, 12),
    inventory: campaign ? await inventoryForCampaign(campaign) : null,
    stages: [
      { id: "preflight", label: "Preflight", description: "Validate keys and models" },
      { id: "discover", label: "Discover", description: "Find target organisations" },
      { id: "mine", label: "Enrich / Score", description: "Contacts + ICP score" },
      { id: "osint", label: "OSINT", description: "Website and sales intel" },
      { id: "all", label: "Full swarm", description: "Discover → mine → OSINT" },
    ],
  });
}
