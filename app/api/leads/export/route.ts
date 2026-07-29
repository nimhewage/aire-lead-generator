import { NextResponse } from "next/server";
import { getActiveCampaign } from "@/lib/campaigns";
import { exportLeadsCsv } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const campaign = await getActiveCampaign();
  if (!campaign) {
    return NextResponse.json({ error: "No active campaign" }, { status: 404 });
  }
  const exported = await exportLeadsCsv(campaign);
  if (!exported) {
    return NextResponse.json({ error: "No leads file found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(exported.body), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exported.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
