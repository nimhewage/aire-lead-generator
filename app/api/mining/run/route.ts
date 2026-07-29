import { NextRequest, NextResponse } from "next/server";
import { startSwarmJob } from "@/lib/runner";
import type { SwarmStage } from "@/lib/types";

export const maxDuration = 300;

const STAGES = new Set(["preflight", "discover", "mine", "osint", "all"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const campaignId = String(body.campaignId || "");
    const stage = (body.stage || "all") as SwarmStage;
    const limit =
      typeof body.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 500)
        : undefined;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }
    if (!STAGES.has(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }

    const job = await startSwarmJob({ campaignId, stage, limit });
    return NextResponse.json({ job });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to start swarm";
    const status = message.includes("already") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
