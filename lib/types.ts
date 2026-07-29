export type JobStatus = "queued" | "running" | "completed" | "failed";

export type SwarmStage =
  | "preflight"
  | "discover"
  | "mine"
  | "osint"
  | "all";

export interface MarketDistrict {
  name: string;
  sectorTags: string[];
}

export interface MarketConfig {
  region: string;
  country: string;
  countryCode: string;
  primaryCity: string;
  /** Additional cities / metros the swarm should cover */
  cities: string[];
  language: string;
  /** Injected into discovery prompts, e.g. "Dubai or the wider UAE" */
  locationPhrase: string;
  /** Label for the geography field in discovery JSON */
  districtLabel: string;
  districts: MarketDistrict[];
  adjacentMarkets: string[];
  timezone?: string;
}

export interface CampaignConfig {
  id: string;
  name: string;
  vendor: {
    name: string;
    positioning: string;
    currency: string;
    site?: string;
  };
  market: MarketConfig;
  icp: {
    sectors: {
      id: string;
      label: string;
      priority: number;
      keywords: string[];
      enabled: boolean;
    }[];
    employeeCount: {
      excludeBelow: number;
      discoveryMinMention: number;
      hardExcludeBelow: number;
    };
    revenueBands: string[];
    businessTypes: string[];
    excludes: string[];
    /** Domains never to mine / always drop */
    excludeDomains: string[];
    demandDrivers: string[];
  };
  discovery: {
    useSeedList: boolean;
    useGroundedSearch: boolean;
    verifyDomains: boolean;
    maxSectorPriority: number;
    enabledSectorIds: string[];
    angles: { id: string; template: string; enabled: boolean }[];
    resultsPerQuery: { min: number; max: number };
    workers: number;
    /** Extra seed domains/companies for this market */
    seedDomains: { name?: string; domain: string; industry?: string; district?: string }[];
  };
  contacts: {
    maxPerCompany: number;
    maxLookups: number;
    buyerTitles: {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
    allowInboxFallback: boolean;
    emailPatterns: string[];
  };
  scoring: {
    maxTotal: number;
    sectorPriorityPoints: Record<string, number>;
    employeeBands: { min: number; points: number }[];
    revenuePoints: Record<string, number>;
    titleTierPoints: {
      tier1: number;
      tier2: number;
      tier3: number;
      other: number;
    };
    contactBonuses: {
      pointsPerContact: number;
      contactDepthCap: number;
      linkedinBonus: number;
    };
    intent: {
      hiringPoints: number;
      modernPlatformPoints: number;
      legacyPlatformPoints: number;
      otherCloudPoints: number;
      modernPlatformKeywords: string[];
      legacyPlatformKeywords: string[];
    };
    maturityPoints: Record<string, number>;
    timing: {
      regulatoryPressurePoints: number;
      businessTypeBonus: Record<string, number>;
    };
    tiers: Record<
      string,
      { min: number; label: string; action: string }
    >;
  };
  services: {
    catalog: { name: string; url: string; pitch: string; buyer: string }[];
    playbook: Record<
      string,
      { primary: string; secondary: string; caseStudyId?: string }
    >;
  };
  runtime: {
    pipeline: string;
    agentworksRoot: string;
    outputDir: string;
    models: { fast: string; deep: string; search: string };
  };
}

export interface MiningJob {
  id: string;
  campaignId: string;
  stage: SwarmStage;
  status: JobStatus;
  startedAt: string;
  completedAt?: string;
  pid?: number;
  logTail: string[];
  error?: string;
  limit?: number;
}

export interface MarketTemplate {
  id: string;
  name: string;
  description: string;
  market: MarketConfig;
  demandDrivers: string[];
}
