"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Check, Copy, MapPin, Plus, Sparkles } from "lucide-react";
import type { CampaignConfig } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TemplateCard = {
  id: string;
  name: string;
  description: string;
  primaryCity: string;
  country: string;
  countryCode: string;
  cities: string[];
};

export default function CampaignsPage() {
  const router = useRouter();
  const { data, mutate } = useSWR("/api/campaigns", fetcher);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const campaigns: CampaignConfig[] = data?.campaigns || [];
  const templates: TemplateCard[] = data?.templates || [];
  const activeId: string | null = data?.activeId ?? null;

  const run = async (
    key: string,
    body: Record<string, unknown>,
    nextHref?: string
  ) => {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Request failed");
      await mutate();
      setMessage(
        body.action === "activate"
          ? `Activated ${payload.campaign?.name}`
          : `Created ${payload.campaign?.name}`
      );
      if (nextHref) router.push(nextHref);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="aire-label">Markets</p>
        <h2 className="text-2xl font-black tracking-tight">
          Destination campaigns
        </h2>
        <p className="text-sm text-[var(--aire-gray-700)] max-w-2xl">
          Spin up a market, tune geography and ICP, then mine. Each destination
          keeps its own pipeline outputs so Dubai never overwrites Sydney.
        </p>
        {message && (
          <p className="text-sm text-[var(--aire-indigo)] font-medium pt-1">
            {message}
          </p>
        )}
      </header>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="aire-label">Active campaigns</p>
            <h3 className="text-lg font-bold mt-1">Your markets</h3>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {campaigns.map((c) => {
            const active = c.id === activeId;
            return (
              <article
                key={c.id}
                className={`aire-card p-4 space-y-3 ${
                  active ? "ring-2 ring-[var(--aire-ink)]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{c.name}</p>
                    <p className="text-xs text-[var(--aire-gray-500)] mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {c.market.primaryCity}
                      {c.market.country ? ` · ${c.market.country}` : ""}
                    </p>
                  </div>
                  {active && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--aire-indigo)]">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--aire-gray-500)] font-mono">
                  pipeline/{c.runtime.pipeline}
                  {c.market.cities?.length
                    ? ` · ${c.market.cities.length} cities`
                    : ""}
                  {c.market.districts?.length
                    ? ` · ${c.market.districts.length} districts`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {!active && (
                    <button
                      type="button"
                      className="aire-btn aire-btn-primary !py-1.5 !px-3 text-xs"
                      disabled={busy === `act-${c.id}`}
                      onClick={() =>
                        run(`act-${c.id}`, { action: "activate", id: c.id })
                      }
                    >
                      Activate
                    </button>
                  )}
                  <Link
                    href="/config"
                    className="aire-btn aire-btn-ghost !py-1.5 !px-3 text-xs"
                    onClick={() => {
                      if (!active) {
                        run(`act-${c.id}`, { action: "activate", id: c.id });
                      }
                    }}
                  >
                    Edit targets
                  </Link>
                  <button
                    type="button"
                    className="aire-btn aire-btn-ghost !py-1.5 !px-3 text-xs"
                    disabled={!!busy}
                    onClick={() =>
                      run(`clone-${c.id}`, {
                        action: "clone",
                        id: c.id,
                        activate: true,
                      }, "/config")
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Clone
                  </button>
                </div>
              </article>
            );
          })}
          {!campaigns.length && (
            <p className="text-sm text-[var(--aire-gray-500)]">
              No campaigns yet — create one from a template below.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="aire-label">Templates</p>
          <h3 className="text-lg font-bold mt-1">Start a new destination</h3>
          <p className="text-sm text-[var(--aire-gray-700)] mt-1">
            Geography, districts and location-aware discovery angles are
            prefilled. Sectors and scoring copy from your base AIRE campaign —
            tune after create.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <article key={t.id} className="aire-card p-4 space-y-3 flex flex-col">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 text-[var(--aire-magenta)] shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold">{t.name}</p>
                  <p className="text-xs text-[var(--aire-gray-500)] mt-1">
                    {t.description}
                  </p>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[var(--aire-gray-500)]">
                {t.cities.slice(0, 4).join(" · ")}
                {t.cities.length > 4 ? "…" : ""}
              </p>
              <button
                type="button"
                className="aire-btn aire-btn-primary !py-2 mt-auto text-xs"
                disabled={busy === `tpl-${t.id}`}
                onClick={() =>
                  run(
                    `tpl-${t.id}`,
                    {
                      action: "createFromTemplate",
                      templateId: t.id,
                      activate: true,
                    },
                    "/config"
                  )
                }
              >
                <Plus className="h-3.5 w-3.5" />
                {busy === `tpl-${t.id}` ? "Creating…" : "Create campaign"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
