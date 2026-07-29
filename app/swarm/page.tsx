"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Crosshair,
  Loader2,
  Play,
  Users,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SwarmPage() {
  const { data, mutate } = useSWR("/api/mining", fetcher, {
    refreshInterval: 2500,
  });
  const [stage, setStage] = useState("all");
  const [limit, setLimit] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = data?.activeJob;
  const busy = active?.status === "running" || active?.status === "queued";

  const run = async (stageId?: string) => {
    if (!data?.campaign?.id) {
      setError("No active campaign. Configure targets first.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/mining/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: data.campaign.id,
          stage: stageId || stage,
          limit: limit ? Number(limit) : undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to start");
      mutate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="aire-label">Mining control</p>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            {data?.campaign?.name || "No campaign"}
          </h2>
          <p className="text-sm text-[var(--aire-gray-700)] mt-1">
            Pick a stage, run it, watch the log. Results land in Leads.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/config" className="aire-btn aire-btn-ghost">
            <Crosshair className="h-4 w-4" />
            Edit targets
          </Link>
          <Link href="/leads" className="aire-btn aire-btn-ghost">
            <Users className="h-4 w-4" />
            Open leads
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="aire-card p-4 space-y-3">
            <p className="aire-label">Stage</p>
            <div className="space-y-2">
              {(data?.stages || []).map(
                (
                  s: { id: string; label: string; description: string },
                  idx: number
                ) => {
                  const selected = stage === s.id;
                  const runningThis =
                    busy && active?.stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(s.id)}
                      className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-[var(--aire-ink)] bg-[var(--aire-ink)] text-[var(--aire-paper)]"
                          : "border-[var(--aire-gray-100)] hover:bg-[var(--aire-gray-50)]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {runningThis && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-bold">{s.label}</p>
                      <p
                        className={`mt-0.5 text-xs ${
                          selected
                            ? "text-[var(--aire-gray-200)]"
                            : "text-[var(--aire-gray-500)]"
                        }`}
                      >
                        {s.description}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="aire-card p-4 space-y-3 sticky top-4">
            <p className="aire-label">Run</p>
            <label className="block space-y-1 text-sm">
              <span className="aire-label">Limit companies (optional)</span>
              <input
                className="aire-input font-mono"
                placeholder="e.g. 25"
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            <button
              type="button"
              className="aire-btn aire-btn-primary w-full"
              disabled={starting || busy}
              onClick={() => run()}
            >
              {starting || busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {busy ? "Swarm running…" : `Run ${stage}`}
            </button>
            <button
              type="button"
              className="aire-btn aire-btn-accent w-full"
              disabled={starting || busy}
              onClick={() => run("all")}
            >
              Run full swarm
            </button>
            {error && (
              <p className="text-xs font-medium text-[var(--aire-magenta)]">
                {error}
              </p>
            )}
            <div className="rounded-md bg-[var(--aire-gray-50)] px-3 py-2 text-xs text-[var(--aire-gray-700)]">
              Inventory:{" "}
              <strong>
                {(data?.inventory?.leadCount ?? 0).toLocaleString()}
              </strong>{" "}
              leads ·{" "}
              <strong>
                {(data?.inventory?.withContacts ?? 0).toLocaleString()}
              </strong>{" "}
              contacts
            </div>
          </div>
        </div>

        <div className="aire-card overflow-hidden min-h-[520px] flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--aire-gray-100)] px-4 py-3">
            <div>
              <p className="aire-label">Live console</p>
              <p className="text-sm font-semibold">
                {active
                  ? `${active.stage} · ${active.status}`
                  : "Waiting for a run"}
              </p>
            </div>
            {busy && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--aire-orange)]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Live
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto bg-[var(--aire-ink)] px-4 py-4 font-mono text-[12px] leading-relaxed text-[var(--aire-paper)]">
            {(active?.logTail?.length
              ? active.logTail
              : [
                  "1. Confirm targets on the Targets page",
                  "2. Choose a stage on the left",
                  "3. Run — logs stream here",
                ]
            ).map((line: string, i: number) => (
              <div
                key={`${i}-${line.slice(0, 24)}`}
                className="whitespace-pre-wrap"
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
