"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import {
  LayoutDashboard,
  Users,
  Crosshair,
  Radar,
  Menu,
  X,
  Circle,
  ExternalLink,
  Globe2,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const WORK_NAV: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    description: "Pipeline health",
    icon: LayoutDashboard,
  },
  {
    href: "/leads",
    label: "Leads",
    description: "Work the queue",
    icon: Users,
  },
];

const MINE_NAV: NavItem[] = [
  {
    href: "/campaigns",
    label: "Markets",
    description: "Destinations",
    icon: Globe2,
  },
  {
    href: "/config",
    label: "Targets",
    description: "Who to find",
    icon: Crosshair,
  },
  {
    href: "/swarm",
    label: "Swarm",
    description: "Run mining",
    icon: Radar,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="aire-label px-3 pt-2 pb-1">{title}</p>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`group flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${
              active
                ? "bg-[var(--aire-ink)] text-[var(--aire-paper)]"
                : "text-[var(--aire-ink)] hover:bg-[var(--aire-gray-50)]"
            }`}
          >
            <Icon
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                active ? "opacity-100" : "opacity-60 group-hover:opacity-100"
              }`}
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">
                {item.label}
              </span>
              <span
                className={`block text-[11px] mt-0.5 ${
                  active ? "text-[var(--aire-gray-200)]" : "text-[var(--aire-gray-500)]"
                }`}
              >
                {item.description}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function SidebarBody({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { data, mutate } = useSWR("/api/campaigns", fetcher, {
    refreshInterval: 8000,
  });
  const { data: mining } = useSWR("/api/mining", fetcher, {
    refreshInterval: 4000,
  });
  const campaign =
    data?.campaigns?.find((c: { id: string }) => c.id === data?.activeId) ||
    data?.campaigns?.[0];
  const busy =
    mining?.activeJob?.status === "running" ||
    mining?.activeJob?.status === "queued";

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4 border-b border-[var(--aire-gray-100)]">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/aire/AIRE_Logo_Square_Dark.svg"
            alt="A/RE"
            className="h-9 w-9"
          />
          <div className="min-w-0">
            <p className="aire-label">A/RE</p>
            <p className="truncate text-sm font-bold tracking-tight">
              Lead Generator Pipeline
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <NavSection
          title="Work"
          items={WORK_NAV}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection
          title="Mine"
          items={MINE_NAV}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </nav>

      <div className="border-t border-[var(--aire-gray-100)] p-3 space-y-3">
        <div className="rounded-md border border-[var(--aire-gray-100)] bg-[var(--aire-gray-50)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="aire-label">Campaign</p>
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${
                busy ? "text-[var(--aire-orange)]" : "text-[var(--aire-gray-500)]"
              }`}
            >
              <Circle
                className={`h-2 w-2 fill-current ${busy ? "animate-pulse" : ""}`}
              />
              {busy ? "Mining" : "Idle"}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug truncate">
            {campaign?.name || "No campaign"}
          </p>
          <p className="mt-1 text-xs text-[var(--aire-gray-500)] truncate">
            {campaign?.market?.primaryCity
              ? `${campaign.market.primaryCity}${
                  campaign.market.countryCode
                    ? ` · ${campaign.market.countryCode}`
                    : ""
                }`
              : "No market"}
          </p>
          <p className="mt-1 text-xs text-[var(--aire-gray-500)]">
            {(data?.inventory?.leadCount ?? 0).toLocaleString()} leads ·{" "}
            {(data?.inventory?.withContacts ?? 0).toLocaleString()} contacts
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(data?.campaigns || []).map(
              (c: {
                id: string;
                market?: { primaryCity?: string };
              }) => {
                const active = c.id === data?.activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      active
                        ? "bg-[var(--aire-ink)] text-[var(--aire-paper)]"
                        : "bg-[var(--aire-white)] text-[var(--aire-gray-700)] border border-[var(--aire-gray-200)] hover:border-[var(--aire-ink)]"
                    }`}
                    onClick={async () => {
                      if (active) return;
                      await fetch("/api/campaigns", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "activate",
                          id: c.id,
                        }),
                      });
                      await mutate();
                      onNavigate?.();
                    }}
                  >
                    {c.market?.primaryCity || c.id}
                  </button>
                );
              }
            )}
          </div>
          <Link
            href="/campaigns"
            onClick={onNavigate}
            className="mt-2 inline-block text-xs font-semibold text-[var(--aire-indigo)] hover:underline"
          >
            All markets →
          </Link>
        </div>
        <a
          href="https://aire.inc/au"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-1 text-xs text-[var(--aire-gray-500)] hover:text-[var(--aire-ink)]"
        >
          aire.inc/au
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: mining } = useSWR("/api/mining", fetcher, {
    refreshInterval: 4000,
  });
  const busy =
    mining?.activeJob?.status === "running" ||
    mining?.activeJob?.status === "queued";

  const title =
    pathname === "/"
      ? "Overview"
      : pathname.startsWith("/leads")
        ? "Leads"
        : pathname.startsWith("/campaigns")
          ? "Markets"
          : pathname.startsWith("/config")
            ? "Targets"
            : pathname.startsWith("/swarm")
              ? "Swarm"
              : "A/RE";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--aire-paper)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-[var(--aire-gray-100)] bg-[var(--aire-white)]">
        <SidebarBody pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-[rgba(26,23,21,0.45)]"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-[280px] max-w-[85vw] bg-[var(--aire-white)] shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-4 rounded p-1.5 hover:bg-[var(--aire-gray-50)]"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--aire-gray-100)] bg-[var(--aire-white)] px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden rounded-md border border-[var(--aire-gray-200)] p-2"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="aire-label hidden sm:block">A/RE Lead Generator</p>
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {busy && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--aire-orange-100)] px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--aire-orange)]">
                <Circle className="h-2 w-2 fill-current animate-pulse" />
                Swarm running
              </span>
            )}
            <Link href="/swarm" className="aire-btn aire-btn-primary !py-2 !px-3 text-xs">
              <Radar className="h-3.5 w-3.5" />
              Run swarm
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
