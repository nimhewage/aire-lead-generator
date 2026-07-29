"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ChevronDown, Download, Radar, Search } from "lucide-react";
import { MarketSwitcher } from "@/components/MarketSwitcher";
import { LeadDetail } from "@/components/LeadDetail";
import type { Lead } from "@/lib/leads";
import { leadSearchBlob } from "@/lib/leads";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TIERS = ["all", "A", "B", "C", "D"] as const;

export default function LeadsPage() {
  const { data: campaigns, mutate: mutateCampaigns } = useSWR(
    "/api/campaigns",
    fetcher,
    { refreshInterval: 8000 }
  );
  const { data, mutate } = useSWR(
    campaigns?.activeId
      ? `/api/leads?market=${campaigns.activeId}`
      : "/api/leads",
    fetcher
  );
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("all");
  const [onlyContacts, setOnlyContacts] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const marketName =
    data?.market?.primaryCity || data?.market?.name || "Active market";

  const filtered = useMemo(() => {
    const leads: Lead[] = data?.leads || [];
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (tier !== "all" && lead.tier !== tier) return false;
      if (onlyContacts && !(lead.contact || lead.email || lead.contacts?.length))
        return false;
      if (!q) return true;
      return leadSearchBlob(lead).includes(q);
    });
  }, [data?.leads, query, tier, onlyContacts]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="aire-label">Queue · {marketName}</p>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            {filtered.length.toLocaleString()} accounts
          </h2>
          <p className="text-sm text-[var(--aire-gray-700)] mt-1">
            Click a row for fit rationale, product match, pitch and buyers.
            {data?.inventory?.updatedAt
              ? ` Updated ${new Date(data.inventory.updatedAt).toLocaleString()}.`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start">
          <a href="/api/leads/export" className="aire-btn aire-btn-ghost">
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Link href="/swarm" className="aire-btn aire-btn-ghost">
            <Radar className="h-4 w-4" />
            Mine more
          </Link>
        </div>
      </section>

      <section className="aire-card p-4">
        <MarketSwitcher
          onSwitched={() => {
            setOpenId(null);
            mutate();
            mutateCampaigns();
          }}
        />
      </section>

      <section className="aire-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--aire-gray-500)]" />
            <input
              className="aire-input !pl-9"
              placeholder="Search company, pain, service, contact…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                  tier === t
                    ? "bg-[var(--aire-ink)] text-[var(--aire-paper)]"
                    : "bg-[var(--aire-gray-50)] text-[var(--aire-gray-700)] hover:bg-[var(--aire-gray-100)]"
                }`}
              >
                {t === "all" ? "All tiers" : `Tier ${t}`}
              </button>
            ))}
            <label className="ml-1 flex items-center gap-2 text-xs font-semibold text-[var(--aire-gray-700)]">
              <input
                type="checkbox"
                checked={onlyContacts}
                onChange={(e) => setOnlyContacts(e.target.checked)}
              />
              Has contact
            </label>
          </div>
        </div>
      </section>

      <div className="aire-card overflow-hidden divide-y divide-[var(--aire-gray-100)]">
        <div className="hidden sm:grid grid-cols-[1.4fr_70px_70px_1fr_1fr_28px] gap-2 px-4 py-3 bg-[var(--aire-gray-50)] aire-label">
          <span>Company</span>
          <span>Tier</span>
          <span>Score</span>
          <span>Contact</span>
          <span>Service fit</span>
          <span />
        </div>

        {filtered.slice(0, 250).map((lead) => {
          const open = openId === lead.id;
          return (
            <div key={lead.id} className={open ? "bg-[var(--aire-white)]" : ""}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : lead.id)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--aire-gray-50)]/80 transition-colors"
                aria-expanded={open}
              >
                <div className="grid gap-2 sm:grid-cols-[1.4fr_70px_70px_1fr_1fr_28px] sm:items-start">
                  <div className="min-w-0">
                    <p className="font-semibold">{lead.company}</p>
                    <p className="font-mono text-xs text-[var(--aire-gray-500)] truncate">
                      {lead.domain}
                    </p>
                    <p className="text-xs text-[var(--aire-gray-500)] mt-0.5">
                      {[lead.sector, lead.city].filter(Boolean).join(" · ")}
                    </p>
                    {!open && lead.fitJustification && (
                      <p className="mt-1.5 text-xs text-[var(--aire-gray-700)] line-clamp-2">
                        {lead.fitJustification}
                      </p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                        lead.tier === "A"
                          ? "bg-[var(--aire-magenta-100)] text-[var(--aire-magenta)]"
                          : lead.tier === "B"
                            ? "bg-[var(--aire-orange-100)] text-[var(--aire-orange)]"
                            : "bg-[var(--aire-gray-100)] text-[var(--aire-gray-700)]"
                      }`}
                    >
                      {lead.tier || "—"}
                    </span>
                  </div>
                  <div className="font-mono font-semibold text-sm">
                    {lead.score || "—"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {lead.contact || "—"}
                    </p>
                    <p className="text-xs text-[var(--aire-gray-500)] truncate">
                      {lead.title}
                    </p>
                  </div>
                  <div className="text-xs text-[var(--aire-gray-700)] line-clamp-2">
                    {lead.service || "—"}
                  </div>
                  <div className="flex justify-end">
                    <ChevronDown
                      className={`h-4 w-4 text-[var(--aire-gray-500)] transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </button>
              {open && <LeadDetail lead={lead} />}
            </div>
          );
        })}

        {!filtered.length && (
          <p className="px-4 py-12 text-center text-[var(--aire-gray-500)]">
            No leads match these filters.
          </p>
        )}
      </div>
    </div>
  );
}
