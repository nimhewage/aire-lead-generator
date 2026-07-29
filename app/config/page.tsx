"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { CampaignConfig } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ConfigPage() {
  const { data, mutate } = useSWR("/api/campaigns", fetcher);
  const [draft, setDraft] = useState<CampaignConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.campaigns?.length) return;
    const active =
      data.campaigns.find((c: CampaignConfig) => c.id === data.activeId) ||
      data.campaigns[0];
    setDraft(structuredClone(active));
  }, [data]);

  if (!draft) {
    return <p className="aire-label">Loading campaign config…</p>;
  }

  const updateSector = (id: string, patch: Partial<CampaignConfig["icp"]["sectors"][0]>) => {
    setDraft({
      ...draft,
      icp: {
        ...draft.icp,
        sectors: draft.icp.sectors.map((s) =>
          s.id === id ? { ...s, ...patch } : s
        ),
      },
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Save failed");
      setMessage("Config saved and activated for the next swarm run.");
      mutate();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="aire-label">ICP controls</p>
        <h2 className="text-2xl font-black tracking-tight">
          Who should the swarm find?
        </h2>
        <p className="text-sm text-[var(--aire-gray-700)] max-w-2xl">
          Change sectors, size, buyers and score cutoffs, then save before you
          mine.
        </p>
      </header>

      <section className="aire-card p-5 space-y-3">
        <p className="aire-label">Campaign</p>
        <input
          className="aire-input font-bold text-lg"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <p className="text-sm text-[var(--aire-gray-500)]">
          {draft.market.primaryCity}
          {draft.market.country ? `, ${draft.market.country}` : ""} · pipeline{" "}
          {draft.runtime.pipeline}
        </p>
      </section>

      <section className="aire-card p-5 space-y-4">
        <div>
          <p className="aire-label">Geography</p>
          <h2 className="text-xl font-bold mt-1">Where should the swarm hunt?</h2>
          <p className="text-sm text-[var(--aire-gray-700)] mt-1">
            Location phrase is injected into every discovery angle. Districts
            bias district-cluster queries and firmographic attribution.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="aire-label">Primary city</span>
            <input
              className="aire-input"
              value={draft.market.primaryCity}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  market: { ...draft.market, primaryCity: e.target.value },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Country</span>
            <input
              className="aire-input"
              value={draft.market.country || draft.market.region}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  market: {
                    ...draft.market,
                    country: e.target.value,
                    region: e.target.value,
                  },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Country code</span>
            <input
              className="aire-input font-mono uppercase"
              value={draft.market.countryCode || ""}
              maxLength={2}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  market: {
                    ...draft.market,
                    countryCode: e.target.value.toUpperCase(),
                  },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Language</span>
            <input
              className="aire-input font-mono"
              value={draft.market.language}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  market: { ...draft.market, language: e.target.value },
                })
              }
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">
            Location phrase (used in discovery prompts)
          </span>
          <input
            className="aire-input"
            value={draft.market.locationPhrase || ""}
            placeholder="e.g. Dubai or the wider UAE"
            onChange={(e) =>
              setDraft({
                ...draft,
                market: { ...draft.market, locationPhrase: e.target.value },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">Cities / metros (comma-separated)</span>
          <input
            className="aire-input"
            value={(draft.market.cities || []).join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                market: {
                  ...draft.market,
                  cities: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">
            Adjacent markets (comma-separated — expansion hints)
          </span>
          <input
            className="aire-input"
            value={(draft.market.adjacentMarkets || []).join(", ")}
            onChange={(e) =>
              setDraft({
                ...draft,
                market: {
                  ...draft.market,
                  adjacentMarkets: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">
            Districts / free zones (one per line: Name | tag1, tag2)
          </span>
          <textarea
            className="aire-input min-h-[140px] font-mono text-xs"
            value={(draft.market.districts || [])
              .map((d) =>
                d.sectorTags?.length
                  ? `${d.name} | ${d.sectorTags.join(", ")}`
                  : d.name
              )
              .join("\n")}
            onChange={(e) =>
              setDraft({
                ...draft,
                market: {
                  ...draft.market,
                  districts: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      const [namePart, tagsPart] = line.split("|");
                      return {
                        name: (namePart || "").trim(),
                        sectorTags: (tagsPart || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      };
                    })
                    .filter((d) => d.name),
                },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">District field label (for LLM JSON)</span>
          <input
            className="aire-input text-sm"
            value={draft.market.districtLabel || ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                market: { ...draft.market, districtLabel: e.target.value },
              })
            }
          />
        </label>
      </section>

      <section className="aire-card p-5 space-y-4">
        <div>
          <p className="aire-label">Seeds & blocklist</p>
          <h2 className="text-xl font-bold mt-1">Must-include / never-touch</h2>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">
            Seed domains (one per line: domain or Name | domain)
          </span>
          <textarea
            className="aire-input min-h-[100px] font-mono text-xs"
            value={(draft.discovery.seedDomains || [])
              .map((s) =>
                s.name ? `${s.name} | ${s.domain}` : s.domain
              )
              .join("\n")}
            onChange={(e) =>
              setDraft({
                ...draft,
                discovery: {
                  ...draft.discovery,
                  seedDomains: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line) => {
                      if (line.includes("|")) {
                        const [name, domain] = line.split("|");
                        return {
                          name: (name || "").trim(),
                          domain: (domain || "").trim().toLowerCase(),
                        };
                      }
                      return { domain: line.toLowerCase() };
                    })
                    .filter((s) => s.domain),
                },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">
            Exclude domains (competitors, already-won, do-not-contact)
          </span>
          <textarea
            className="aire-input min-h-[80px] font-mono text-xs"
            value={(draft.icp.excludeDomains || []).join("\n")}
            onChange={(e) =>
              setDraft({
                ...draft,
                icp: {
                  ...draft.icp,
                  excludeDomains: e.target.value
                    .split("\n")
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean),
                },
              })
            }
          />
        </label>
      </section>

      <section className="aire-card p-5 space-y-4">
        <div>
          <p className="aire-label">Firmographics</p>
          <h2 className="text-xl font-bold mt-1">Size & filters</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="aire-label">Exclude below (employees)</span>
            <input
              type="number"
              className="aire-input"
              value={draft.icp.employeeCount.hardExcludeBelow}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  icp: {
                    ...draft.icp,
                    employeeCount: {
                      ...draft.icp.employeeCount,
                      hardExcludeBelow: Number(e.target.value),
                    },
                  },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Discovery min (employees)</span>
            <input
              type="number"
              className="aire-input"
              value={draft.icp.employeeCount.discoveryMinMention}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  icp: {
                    ...draft.icp,
                    employeeCount: {
                      ...draft.icp.employeeCount,
                      discoveryMinMention: Number(e.target.value),
                    },
                  },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Max sector priority</span>
            <input
              type="number"
              min={1}
              max={3}
              className="aire-input"
              value={draft.discovery.maxSectorPriority}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  discovery: {
                    ...draft.discovery,
                    maxSectorPriority: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="aire-label">Anti-ICP excludes (one per line)</span>
          <textarea
            className="aire-input min-h-[96px] font-mono text-xs"
            value={draft.icp.excludes.join("\n")}
            onChange={(e) =>
              setDraft({
                ...draft,
                icp: {
                  ...draft.icp,
                  excludes: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                },
              })
            }
          />
        </label>
      </section>

      <section className="aire-card p-5 space-y-4">
        <div>
          <p className="aire-label">Sectors</p>
          <h2 className="text-xl font-bold mt-1">Enable / prioritise markets</h2>
        </div>
        <div className="space-y-2">
          {draft.icp.sectors.map((sector) => (
            <div
              key={sector.id}
              className="grid grid-cols-[auto_1fr_100px] items-center gap-3 border-b border-[var(--aire-gray-100)] py-2"
            >
              <input
                type="checkbox"
                checked={sector.enabled}
                onChange={(e) =>
                  updateSector(sector.id, { enabled: e.target.checked })
                }
              />
              <div>
                <p className="font-semibold text-sm">{sector.label}</p>
                <p className="text-xs text-[var(--aire-gray-500)] font-mono">
                  {sector.id}
                </p>
              </div>
              <label className="text-xs">
                <span className="aire-label">Priority</span>
                <select
                  className="aire-input mt-1"
                  value={sector.priority}
                  onChange={(e) =>
                    updateSector(sector.id, {
                      priority: Number(e.target.value),
                    })
                  }
                >
                  <option value={1}>1 · Primary</option>
                  <option value={2}>2 · Secondary</option>
                  <option value={3}>3 · Opportunistic</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="aire-card p-5 space-y-4">
        <div>
          <p className="aire-label">Buyer personas</p>
          <h2 className="text-xl font-bold mt-1">Titles the swarm hunts</h2>
        </div>
        {(["tier1", "tier2", "tier3"] as const).map((tier) => (
          <label key={tier} className="block space-y-1 text-sm">
            <span className="aire-label">{tier} titles</span>
            <textarea
              className="aire-input min-h-[88px] font-mono text-xs"
              value={draft.contacts.buyerTitles[tier].join("\n")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contacts: {
                    ...draft.contacts,
                    buyerTitles: {
                      ...draft.contacts.buyerTitles,
                      [tier]: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  },
                })
              }
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.contacts.allowInboxFallback}
            onChange={(e) =>
              setDraft({
                ...draft,
                contacts: {
                  ...draft.contacts,
                  allowInboxFallback: e.target.checked,
                },
              })
            }
          />
          Allow info@ inbox fallback when no named executive is found
        </label>
      </section>

      <section className="aire-card p-5 space-y-4">
        <div>
          <p className="aire-label">Scoring</p>
          <h2 className="text-xl font-bold mt-1">Tier thresholds</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {(["A", "B", "C", "D"] as const).map((tier) => (
            <label key={tier} className="space-y-1 text-sm">
              <span className="aire-label">
                Tier {tier} · {draft.scoring.tiers[tier]?.label}
              </span>
              <input
                type="number"
                className="aire-input"
                value={draft.scoring.tiers[tier]?.min ?? 0}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    scoring: {
                      ...draft.scoring,
                      tiers: {
                        ...draft.scoring.tiers,
                        [tier]: {
                          ...draft.scoring.tiers[tier],
                          min: Number(e.target.value),
                        },
                      },
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="aire-label">Hiring signal pts</span>
            <input
              type="number"
              className="aire-input"
              value={draft.scoring.intent.hiringPoints}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  scoring: {
                    ...draft.scoring,
                    intent: {
                      ...draft.scoring.intent,
                      hiringPoints: Number(e.target.value),
                    },
                  },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Regulatory pts</span>
            <input
              type="number"
              className="aire-input"
              value={draft.scoring.timing.regulatoryPressurePoints}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  scoring: {
                    ...draft.scoring,
                    timing: {
                      ...draft.scoring.timing,
                      regulatoryPressurePoints: Number(e.target.value),
                    },
                  },
                })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="aire-label">Max contact lookups</span>
            <input
              type="number"
              className="aire-input"
              value={draft.contacts.maxLookups}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  contacts: {
                    ...draft.contacts,
                    maxLookups: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="aire-card p-5 space-y-3">
        <div>
          <p className="aire-label">Discovery angles</p>
          <h2 className="text-xl font-bold mt-1">Research lenses</h2>
          <p className="text-xs text-[var(--aire-gray-500)] mt-1 font-mono">
            Placeholders: {"{label}"} {"{location}"} {"{city}"} {"{region}"}{" "}
            {"{country}"}
          </p>
        </div>
        {draft.discovery.angles.map((angle, idx) => (
          <div
            key={angle.id}
            className="flex items-start gap-3 border-b border-[var(--aire-gray-100)] py-2 text-sm"
          >
            <input
              type="checkbox"
              className="mt-2"
              checked={angle.enabled}
              onChange={(e) => {
                const angles = [...draft.discovery.angles];
                angles[idx] = { ...angle, enabled: e.target.checked };
                setDraft({
                  ...draft,
                  discovery: { ...draft.discovery, angles },
                });
              }}
            />
            <div className="flex-1 space-y-1">
              <span className="font-semibold">{angle.id}</span>
              <textarea
                className="aire-input min-h-[64px] font-mono text-xs"
                value={angle.template}
                onChange={(e) => {
                  const angles = [...draft.discovery.angles];
                  angles[idx] = { ...angle, template: e.target.value };
                  setDraft({
                    ...draft,
                    discovery: { ...draft.discovery, angles },
                  });
                }}
              />
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-3 pb-10">
        <button
          type="button"
          className="aire-btn aire-btn-primary"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Saving…" : "Save & activate config"}
        </button>
        {message && (
          <p className="text-sm text-[var(--aire-indigo)] font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
