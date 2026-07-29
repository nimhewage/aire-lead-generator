"use client";

import {
  ExternalLink,
  Link2,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import type { Lead } from "@/lib/leads";

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <div className="space-y-1.5">
      <p className="aire-label">{label}</p>
      <div className="text-sm text-[var(--aire-ink)] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function TextBlock({ value }: { value?: string }) {
  if (!value?.trim()) return null;
  return <p className="whitespace-pre-wrap">{value}</p>;
}

function ChipList({ value }: { value?: string }) {
  if (!value?.trim()) return null;
  const parts = value
    .split(/\||;|,|\n| · /)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((p) => (
        <span
          key={p}
          className="rounded-md bg-[var(--aire-gray-50)] border border-[var(--aire-gray-100)] px-2 py-1 text-xs font-medium"
        >
          {p}
        </span>
      ))}
    </div>
  );
}

function LinkOut({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[var(--aire-indigo)] hover:underline"
    >
      {children}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function LeadDetail({ lead }: { lead: Lead }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] border-t border-[var(--aire-gray-100)] bg-[var(--aire-gray-50)]/60 px-4 py-5 sm:px-5">
      <div className="space-y-5">
        <Section label="Why this is a match">
          <TextBlock value={lead.fitJustification} />
          {!lead.fitJustification && <TextBlock value={lead.scoreReasons} />}
        </Section>

        {(lead.whyTheyNeedUs || lead.opportunitySummary) && (
          <Section label="Why they need AIRE">
            <TextBlock value={lead.whyTheyNeedUs || lead.opportunitySummary} />
          </Section>
        )}

        {(lead.painPoints || lead.aiDataGap) && (
          <Section label="Pain points & AI/data gap">
            <TextBlock value={lead.painPoints} />
            {lead.aiDataGap && (
              <p className="mt-2 text-sm">
                <span className="font-semibold">Gap: </span>
                {lead.aiDataGap}
              </p>
            )}
          </Section>
        )}

        {(lead.outreachAngle || lead.bestOpener) && (
          <Section label="Outreach angle">
            {lead.bestOpener && (
              <p className="rounded-md border border-[var(--aire-indigo)]/20 bg-[var(--aire-white)] px-3 py-2 text-sm italic">
                “{lead.bestOpener}”
              </p>
            )}
            <TextBlock value={lead.outreachAngle} />
            {lead.preferredChannel && (
              <p className="text-xs text-[var(--aire-gray-500)] mt-1">
                Preferred channel: {lead.preferredChannel}
              </p>
            )}
          </Section>
        )}

        {lead.scoreReasons && lead.fitJustification && (
          <Section label="Score breakdown">
            <ChipList value={lead.scoreReasons.replace(/ \| /g, " · ")} />
          </Section>
        )}
      </div>

      <div className="space-y-5">
        <Section label="Product / service fit">
          <div className="space-y-2">
            {lead.primaryService && (
              <p className="font-semibold">
                <Sparkles className="inline h-3.5 w-3.5 mr-1 text-[var(--aire-magenta)]" />
                <LinkOut href={lead.primaryServiceUrl}>
                  {lead.primaryService}
                </LinkOut>
              </p>
            )}
            {lead.secondaryService && (
              <p className="text-sm">
                Secondary:{" "}
                <LinkOut href={lead.secondaryServiceUrl}>
                  {lead.secondaryService}
                </LinkOut>
              </p>
            )}
            <ChipList value={lead.recommendedServices} />
            <TextBlock
              value={lead.serviceDetail || lead.serviceFitRationale}
            />
          </div>
        </Section>

        {(lead.caseStudy || lead.caseStudyOutcome) && (
          <Section label="Comparable case study">
            <p className="font-semibold">
              <LinkOut href={lead.caseStudyUrl}>{lead.caseStudy}</LinkOut>
            </p>
            {lead.caseStudyIndustry && (
              <p className="text-xs text-[var(--aire-gray-500)]">
                {lead.caseStudyIndustry}
              </p>
            )}
            <TextBlock value={lead.caseStudyOutcome} />
          </Section>
        )}

        <Section label="Firmographics">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            {[
              ["Employees", lead.employees],
              ["Revenue", lead.revenue],
              ["Type", lead.businessType],
              ["Maturity", lead.dataMaturity],
              ["Hiring AI/data", lead.hiringSignal],
              ["Regulatory", lead.regulatoryFlag],
              ["Deal size", lead.dealSize],
              ["District", lead.district],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k as string}>
                  <dt className="aire-label">{k as string}</dt>
                  <dd className="font-medium mt-0.5">{v}</dd>
                </div>
              ))}
          </dl>
          {lead.description && (
            <p className="mt-3 text-sm text-[var(--aire-gray-700)]">
              {lead.description}
            </p>
          )}
          {lead.techStack && (
            <div className="mt-3">
              <p className="aire-label mb-1">Tech signals</p>
              <ChipList value={lead.techStack} />
            </div>
          )}
          {lead.buyingSignals && (
            <div className="mt-3">
              <p className="aire-label mb-1">Buying signals</p>
              <ChipList value={lead.buyingSignals} />
            </div>
          )}
        </Section>

        <Section label="Buyers">
          <div className="space-y-3">
            {lead.contacts.length === 0 && (
              <p className="text-sm text-[var(--aire-gray-500)]">
                No contacts on file.
              </p>
            )}
            {lead.contacts.map((c, i) => (
              <div
                key={`${c.email || c.name}-${i}`}
                className="rounded-md border border-[var(--aire-gray-100)] bg-[var(--aire-white)] px-3 py-2"
              >
                <p className="font-semibold text-sm">{c.name || "Unknown"}</p>
                <p className="text-xs text-[var(--aire-gray-500)]">{c.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-1 text-[var(--aire-indigo)] hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <span className="inline-flex items-center gap-1 text-[var(--aire-gray-700)]">
                      <Phone className="h-3 w-3" />
                      {c.phone}
                    </span>
                  )}
                  {c.linkedin && (
                    <a
                      href={c.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--aire-indigo)] hover:underline"
                    >
                      <Link2 className="h-3 w-3" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="flex flex-wrap gap-3 text-xs">
          {lead.website && (
            <LinkOut href={lead.website}>Website</LinkOut>
          )}
          {lead.linkedinCompany && (
            <LinkOut href={lead.linkedinCompany}>Company LinkedIn</LinkOut>
          )}
          {lead.domain && (
            <span className="font-mono text-[var(--aire-gray-500)]">
              {lead.domain}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
