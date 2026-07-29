"use client";

import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  Crosshair,
  Radar,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { MarketSwitcher } from "@/components/MarketSwitcher";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data, mutate: mutateCampaigns } = useSWR("/api/campaigns", fetcher, {
    refreshInterval: 8000,
  });
  const { data: mining } = useSWR("/api/mining", fetcher, {
    refreshInterval: 4000,
  });
  const { data: leadsData, mutate: mutateLeads } = useSWR(
    data?.activeId ? `/api/leads?market=${data.activeId}` : "/api/leads",
    fetcher
  );

  const campaign =
    data?.campaigns?.find((c: { id: string }) => c.id === data?.activeId) ||
    data?.campaigns?.[0];
  const inventory = data?.inventory;
  const leads = leadsData?.leads || [];
  const tierA = leads.filter((l: { tier: string }) => l.tier === "A").length;
  const tierB = leads.filter((l: { tier: string }) => l.tier === "B").length;
  const withContact = inventory?.withContacts ?? 0;
  const total = inventory?.leadCount ?? 0;
  const contactPct = total ? Math.round((withContact / total) * 100) : 0;
  const busy =
    mining?.activeJob?.status === "running" ||
    mining?.activeJob?.status === "queued";
  const enabledSectors =
    campaign?.icp?.sectors?.filter((s: { enabled: boolean }) => s.enabled)
      .length ?? 0;

  const nextAction = !total
    ? {
        title: "No leads yet",
        body: "Set who you want, then run the swarm.",
        href: "/config",
        cta: "Set targets",
      }
    : contactPct < 70
      ? {
          title: "Contacts still thin",
          body: `${contactPct}% of accounts have a contact point. Re-run enrich/score or tighten buyer titles.`,
          href: "/swarm",
          cta: "Run enrich stage",
        }
      : {
          title: "Ready to work the queue",
          body: `${tierA} hot and ${tierB} warm accounts waiting.`,
          href: "/leads",
          cta: "Open leads",
        };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="aire-label">Today</p>
          <h2 className="aire-display text-3xl sm:text-4xl">
            {campaign?.name || "Lead Generator Pipeline"}
          </h2>
          <p className="text-sm text-[var(--aire-gray-700)]">
            {campaign
              ? `${campaign.market.primaryCity}${
                  campaign.market.country ? `, ${campaign.market.country}` : ""
                } · ${enabledSectors} sectors enabled`
              : "Activate a campaign to begin."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/campaigns" className="aire-btn aire-btn-ghost">
            Markets
          </Link>
          <Link href="/config" className="aire-btn aire-btn-ghost">
            <Crosshair className="h-4 w-4" />
            Targets
          </Link>
          <Link href="/swarm" className="aire-btn aire-btn-accent">
            <Radar className="h-4 w-4" />
            {busy ? "View swarm" : "Mine leads"}
          </Link>
        </div>
      </section>

      <section className="aire-card p-4">
        <MarketSwitcher
          onSwitched={() => {
            mutateCampaigns();
            mutateLeads();
          }}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Leads in pipeline", value: total.toLocaleString() },
          { label: "With contacts", value: `${contactPct}%` },
          { label: "Tier A · Hot", value: String(tierA) },
          { label: "Tier B · Warm", value: String(tierB) },
        ].map((stat) => (
          <div key={stat.label} className="aire-card p-4">
            <p className="aire-label">{stat.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="aire-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="aire-label">Next best action</p>
              <h3 className="mt-1 text-xl font-bold">{nextAction.title}</h3>
              <p className="mt-1 text-sm text-[var(--aire-gray-700)] max-w-xl">
                {nextAction.body}
              </p>
            </div>
            {busy ? (
              <AlertCircle className="h-5 w-5 text-[var(--aire-orange)] shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-[var(--aire-indigo)] shrink-0" />
            )}
          </div>
          <Link href={nextAction.href} className="aire-btn aire-btn-primary">
            {nextAction.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="aire-card p-5 space-y-3">
          <p className="aire-label">Workflow</p>
          <ol className="space-y-3">
            {[
              {
                step: "01",
                label: "Pick a market",
                href: "/campaigns",
                done: Boolean(campaign?.market?.primaryCity),
              },
              {
                step: "02",
                label: "Define targets",
                href: "/config",
                done: enabledSectors > 0,
              },
              {
                step: "03",
                label: "Run the swarm",
                href: "/swarm",
                done: total > 0,
              },
              {
                step: "04",
                label: "Work hot leads",
                href: "/leads",
                done: tierA + tierB > 0,
              },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-[var(--aire-gray-50)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--aire-gray-500)]">
                      {item.step}
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      item.done
                        ? "bg-[var(--aire-indigo)]"
                        : "bg-[var(--aire-gray-200)]"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="aire-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--aire-gray-100)] px-5 py-3">
          <div>
            <p className="aire-label">Top accounts</p>
            <p className="text-sm font-semibold">Highest ICP score</p>
          </div>
          <Link
            href="/leads"
            className="text-sm font-semibold text-[var(--aire-indigo)] inline-flex items-center gap-1"
          >
            All leads
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-[var(--aire-gray-100)]">
          {leads.slice(0, 5).map(
            (lead: {
              company: string;
              domain: string;
              tier: string;
              score: number;
              contact: string;
              service: string;
            }) => (
              <div
                key={`${lead.domain}-${lead.contact}`}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{lead.company}</p>
                  <p className="text-xs text-[var(--aire-gray-500)] truncate">
                    {lead.contact || "No contact"} · {lead.service || "—"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold">
                    {lead.tier || "—"} · {lead.score || 0}
                  </p>
                </div>
              </div>
            )
          )}
          {!leads.length && (
            <div className="px-5 py-10 text-center text-sm text-[var(--aire-gray-500)]">
              <Users className="mx-auto mb-2 h-5 w-5 opacity-50" />
              Mine a market to fill this list.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
