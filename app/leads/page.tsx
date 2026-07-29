"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Download, Radar, Search } from "lucide-react";
import { MarketSwitcher } from "@/components/MarketSwitcher";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Lead = {
  company: string;
  domain: string;
  sector: string;
  tier: string;
  score: number;
  contact: string;
  title: string;
  email: string;
  service: string;
  city: string;
};

const TIERS = ["all", "A", "B", "C", "D"] as const;

export default function LeadsPage() {
  const { data: campaigns, mutate: mutateCampaigns } = useSWR(
    "/api/campaigns",
    fetcher,
    { refreshInterval: 8000 }
  );
  const { data, mutate } = useSWR(
    campaigns?.activeId ? `/api/leads?market=${campaigns.activeId}` : "/api/leads",
    fetcher
  );
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("all");
  const [onlyContacts, setOnlyContacts] = useState(false);

  const leads: Lead[] = data?.leads || [];
  const marketName =
    data?.market?.primaryCity || data?.market?.name || "Active market";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (tier !== "all" && lead.tier !== tier) return false;
      if (onlyContacts && !(lead.contact || lead.email)) return false;
      if (!q) return true;
      return [
        lead.company,
        lead.domain,
        lead.contact,
        lead.email,
        lead.sector,
        lead.service,
        lead.city,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [leads, query, tier, onlyContacts]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="aire-label">Queue · {marketName}</p>
          <h2 className="text-2xl font-black tracking-tight mt-1">
            {filtered.length.toLocaleString()} accounts
          </h2>
          <p className="text-sm text-[var(--aire-gray-700)] mt-1">
            {data?.inventory?.updatedAt
              ? `Updated ${new Date(data.inventory.updatedAt).toLocaleString()}`
              : "Run a swarm to populate this queue."}
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
              placeholder="Search company, contact, domain…"
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

      <div className="aire-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--aire-gray-100)] bg-[var(--aire-gray-50)]">
              <tr className="aire-label">
                <th className="px-4 py-3 font-normal">Company</th>
                <th className="px-4 py-3 font-normal">Tier</th>
                <th className="px-4 py-3 font-normal">Score</th>
                <th className="px-4 py-3 font-normal">Contact</th>
                <th className="px-4 py-3 font-normal">Service fit</th>
                <th className="px-4 py-3 font-normal">City</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 250).map((lead) => (
                <tr
                  key={`${lead.domain}-${lead.contact}-${lead.score}`}
                  className="border-b border-[var(--aire-gray-100)] align-top hover:bg-[var(--aire-gray-50)]/70"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{lead.company}</p>
                    <p className="font-mono text-xs text-[var(--aire-gray-500)]">
                      {lead.domain}
                    </p>
                    <p className="text-xs text-[var(--aire-gray-500)] mt-0.5">
                      {lead.sector}
                    </p>
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {lead.score || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{lead.contact || "—"}</p>
                    <p className="text-xs text-[var(--aire-gray-500)]">
                      {lead.title}
                    </p>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="font-mono text-xs text-[var(--aire-indigo)] hover:underline"
                      >
                        {lead.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[180px]">
                    {lead.service || "—"}
                  </td>
                  <td className="px-4 py-3">{lead.city || "—"}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-[var(--aire-gray-500)]"
                  >
                    No leads match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
