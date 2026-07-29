"use client";

import useSWR from "swr";
import { MapPin } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type CampaignLite = {
  id: string;
  name: string;
  market: { primaryCity: string; countryCode?: string; country?: string };
  runtime: { pipeline: string };
};

type Inventory = {
  leadCount: number;
  withContacts: number;
};

export function MarketSwitcher({
  compact = false,
  onSwitched,
}: {
  compact?: boolean;
  onSwitched?: () => void;
}) {
  const { data, mutate } = useSWR("/api/campaigns", fetcher, {
    refreshInterval: 8000,
  });
  const campaigns: CampaignLite[] = data?.campaigns || [];
  const activeId: string | null = data?.activeId ?? null;
  const inventories: Record<string, Inventory> = data?.inventories || {};

  const activate = async (id: string) => {
    if (id === activeId) return;
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate", id }),
    });
    await mutate();
    onSwitched?.();
  };

  if (!campaigns.length) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-[var(--aire-gray-500)]" />
          <p className="aire-label">Switch market</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {campaigns.map((c) => {
          const active = c.id === activeId;
          const count = inventories[c.id]?.leadCount ?? 0;
          const label = c.market.primaryCity || c.name;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => activate(c.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-[var(--aire-ink)] bg-[var(--aire-ink)] text-[var(--aire-paper)]"
                  : "border-[var(--aire-gray-200)] bg-[var(--aire-white)] text-[var(--aire-ink)] hover:border-[var(--aire-ink)]"
              }`}
              title={c.name}
            >
              <span>{label}</span>
              {c.market.countryCode && (
                <span
                  className={`font-mono text-[10px] uppercase ${
                    active ? "text-[var(--aire-gray-200)]" : "text-[var(--aire-gray-500)]"
                  }`}
                >
                  {c.market.countryCode}
                </span>
              )}
              <span
                className={`font-mono tabular-nums ${
                  active ? "text-[var(--aire-gray-200)]" : "text-[var(--aire-gray-500)]"
                }`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
