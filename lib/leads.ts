export type LeadContact = {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
};

export type Lead = {
  id: string;
  company: string;
  domain: string;
  website: string;
  linkedinCompany: string;
  sector: string;
  subIndustry: string;
  tier: string;
  score: number;
  city: string;
  state: string;
  country: string;
  district: string;
  employees: string;
  revenue: string;
  businessType: string;
  description: string;
  techStack: string;
  /** Why this account matches AIRE ICP */
  fitJustification: string;
  scoreReasons: string;
  /** Pain / gaps */
  painPoints: string;
  aiDataGap: string;
  whyTheyNeedUs: string;
  /** Product / service match */
  primaryService: string;
  secondaryService: string;
  recommendedServices: string;
  serviceDetail: string;
  serviceFitRationale: string;
  primaryServiceUrl: string;
  secondaryServiceUrl: string;
  /** Case study / commercial */
  caseStudy: string;
  caseStudyIndustry: string;
  caseStudyOutcome: string;
  caseStudyUrl: string;
  dealSize: string;
  outreachAngle: string;
  bestOpener: string;
  opportunitySummary: string;
  buyingSignals: string;
  preferredChannel: string;
  dataMaturity: string;
  hiringSignal: string;
  regulatoryFlag: string;
  contacts: LeadContact[];
  /** Convenience for list row */
  contact: string;
  title: string;
  email: string;
  service: string;
};

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const v = (row[key] || "").trim();
    if (v) return v;
  }
  return "";
}

function splitList(value: string): string[] {
  if (!value) return [];
  return value
    .split(/\||;|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function contactsFromRow(row: Record<string, string>): LeadContact[] {
  const out: LeadContact[] = [];
  for (const n of [1, 2, 3] as const) {
    const name = pick(row, `contact_${n}_name`);
    const title = pick(row, `contact_${n}_title`);
    const email = pick(row, `contact_${n}_email`);
    const phone = pick(row, `contact_${n}_phone`);
    const linkedin = pick(row, `contact_${n}_linkedin`);
    if (!name && !email && !title) continue;
    out.push({ name, title, email, phone, linkedin });
  }
  return out;
}

export function mapLeadRow(row: Record<string, string>, fallbackCity = ""): Lead {
  const contacts = contactsFromRow(row);
  const primary = contacts[0];
  const domain = pick(row, "company_domain");
  const company = pick(row, "company_name") || domain;
  const primaryService = pick(
    row,
    "primary_service",
    "recommended_service",
    "recommended_services"
  );
  const recommendedServices = pick(
    row,
    "recommended_services",
    "recommended_service",
    "primary_service"
  );

  return {
    id: `${domain || company}-${pick(row, "icp_score")}`,
    company,
    domain,
    website: pick(row, "company_website"),
    linkedinCompany: pick(
      row,
      "company_linkedin",
      "osint_linkedin_company_url"
    ),
    sector: pick(row, "segment", "industry"),
    subIndustry: pick(row, "sub_industry", "industry"),
    tier: pick(row, "icp_tier").toUpperCase(),
    score: Number(pick(row, "icp_score") || 0),
    city: pick(row, "city") || fallbackCity,
    state: pick(row, "state", "emirate"),
    country: pick(row, "country"),
    district: pick(row, "district"),
    employees: pick(row, "employee_count"),
    revenue: pick(
      row,
      "estimated_revenue_aud",
      "revenue_band",
      "osint_revenue_tier"
    ),
    businessType: pick(row, "business_type"),
    description: pick(row, "company_description", "description"),
    techStack: pick(
      row,
      "tech_stack",
      "cloud_platform_signals",
      "osint_tech_stack_detected"
    ).replace(/\|/g, ", "),
    fitJustification: pick(row, "fit_justification"),
    scoreReasons: pick(row, "score_reasons"),
    painPoints: pick(
      row,
      "identified_pain_points",
      "osint_pain_summary"
    ),
    aiDataGap: pick(row, "ai_data_gap", "osint_ai_data_gap_signals"),
    whyTheyNeedUs: pick(
      row,
      "why_they_need_our_services",
      "osint_opportunity_summary",
      "service_fit_rationale"
    ),
    primaryService,
    secondaryService: pick(row, "secondary_service"),
    recommendedServices,
    serviceDetail: pick(
      row,
      "service_recommendation_detail",
      "service_fit_rationale"
    ),
    serviceFitRationale: pick(
      row,
      "service_fit_rationale",
      "service_recommendation_detail"
    ),
    primaryServiceUrl: pick(row, "primary_service_url"),
    secondaryServiceUrl: pick(row, "secondary_service_url"),
    caseStudy: pick(row, "comparable_case_study"),
    caseStudyIndustry: pick(row, "case_study_industry"),
    caseStudyOutcome: pick(row, "case_study_outcome"),
    caseStudyUrl: pick(row, "case_study_url"),
    dealSize: pick(row, "estimated_deal_size_usd"),
    outreachAngle: pick(row, "recommended_outreach_angle"),
    bestOpener: pick(row, "osint_best_opener"),
    opportunitySummary: pick(row, "osint_opportunity_summary"),
    buyingSignals: pick(row, "osint_buying_signals").replace(/\|/g, " · "),
    preferredChannel: pick(row, "osint_preferred_channel"),
    dataMaturity: pick(row, "data_maturity_stage"),
    hiringSignal: pick(row, "hiring_data_ai_signals"),
    regulatoryFlag: pick(row, "regulatory_pressure_flag"),
    contacts,
    contact: primary?.name || "",
    title: primary?.title || "",
    email: primary?.email || "",
    service: primaryService || splitList(recommendedServices)[0] || "",
  };
}

export function leadSearchBlob(lead: Lead): string {
  return [
    lead.company,
    lead.domain,
    lead.contact,
    lead.email,
    lead.sector,
    lead.service,
    lead.city,
    lead.fitJustification,
    lead.painPoints,
    lead.whyTheyNeedUs,
    lead.recommendedServices,
    lead.caseStudy,
    lead.outreachAngle,
    ...lead.contacts.flatMap((c) => [c.name, c.title, c.email]),
  ]
    .join(" ")
    .toLowerCase();
}
