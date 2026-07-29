import type { MarketTemplate } from "./types";

/** Location-parameterized discovery angles — use {label}, {location}, {city}, {region}, {country} */
export const LOCATION_AWARE_ANGLES = [
  {
    id: "scale",
    enabled: true,
    template:
      "the largest and most established {label} organisations with major operating presence in {location}, prioritising those with more than 200 staff",
  },
  {
    id: "intent_hiring",
    enabled: true,
    template:
      "{label} organisations in {location} that are currently hiring data engineers, data scientists, analytics or AI roles, or that have recently built out a data team",
  },
  {
    id: "intent_platform",
    enabled: true,
    template:
      "{label} organisations in {location} that have publicly announced data platform, lakehouse, cloud migration, Databricks, Snowflake, Microsoft Fabric, analytics or artificial intelligence initiatives",
  },
  {
    id: "transformation",
    enabled: true,
    template:
      "{label} organisations in {location} undergoing digital transformation, reporting rapid growth, merging, or facing new regulatory reporting obligations",
  },
  {
    id: "district_cluster",
    enabled: true,
    template:
      "{label} headquarters or major offices clustered in key business districts of {city} / {region}",
  },
];

export const MARKET_TEMPLATES: MarketTemplate[] = [
  {
    id: "dubai-uae",
    name: "Dubai / UAE",
    description: "GCC enterprise hub — DIFC, free zones, Abu Dhabi adjacency",
    demandDrivers: [
      "UAE National AI Strategy 2031",
      "Dubai D33 economic agenda",
      "Data residency and regulated-industry AI governance",
    ],
    market: {
      region: "United Arab Emirates",
      country: "United Arab Emirates",
      countryCode: "AE",
      primaryCity: "Dubai",
      cities: ["Dubai", "Abu Dhabi", "Sharjah"],
      language: "en",
      locationPhrase: "Dubai or the wider UAE",
      districtLabel: "Dubai district, free zone, or emirate if known, else empty string",
      adjacentMarkets: ["Abu Dhabi", "Sharjah", "Riyadh", "Doha"],
      timezone: "Asia/Dubai",
      districts: [
        { name: "DIFC", sectorTags: ["financial services", "banking", "insurance", "fintech"] },
        { name: "Downtown Dubai", sectorTags: ["real estate", "hospitality", "retail"] },
        { name: "Business Bay", sectorTags: ["professional services", "real estate"] },
        { name: "Dubai Internet City", sectorTags: ["technology", "saas", "telecom"] },
        { name: "Jebel Ali / JAFZA", sectorTags: ["logistics", "manufacturing", "energy"] },
        { name: "Abu Dhabi", sectorTags: ["energy", "government", "aviation"] },
      ],
    },
  },
  {
    id: "riyadh-ksa",
    name: "Riyadh / Saudi Arabia",
    description: "Vision 2030 — KAFD, NEOM adjacency, sovereign & energy buyers",
    demandDrivers: [
      "Saudi Vision 2030 digital transformation",
      "SDAIA national AI strategy",
      "PDPL data protection compliance",
    ],
    market: {
      region: "Saudi Arabia",
      country: "Saudi Arabia",
      countryCode: "SA",
      primaryCity: "Riyadh",
      cities: ["Riyadh", "Jeddah", "Dammam", "Khobar", "NEOM"],
      language: "en",
      locationPhrase: "Riyadh or the wider Kingdom of Saudi Arabia",
      districtLabel: "city, business district, or economic zone if known, else empty string",
      adjacentMarkets: ["Jeddah", "Dammam", "Dubai", "Bahrain"],
      timezone: "Asia/Riyadh",
      districts: [
        { name: "King Abdullah Financial District", sectorTags: ["financial services", "banking", "insurance"] },
        { name: "Olaya / Diplomatic Quarter", sectorTags: ["government", "professional services"] },
        { name: "Jeddah", sectorTags: ["logistics", "retail", "hospitality"] },
        { name: "Eastern Province", sectorTags: ["energy", "oil", "gas", "petrochemical"] },
        { name: "NEOM / Red Sea", sectorTags: ["technology", "tourism", "construction"] },
      ],
    },
  },
  {
    id: "doha-qatar",
    name: "Doha / Qatar",
    description: "Energy & sovereign wealth — West Bay, Lusail, Education City",
    demandDrivers: [
      "Qatar National Vision 2030",
      "LNG and energy digitalisation",
      "Financial centre expansion (QFC)",
    ],
    market: {
      region: "Qatar",
      country: "Qatar",
      countryCode: "QA",
      primaryCity: "Doha",
      cities: ["Doha", "Lusail", "Al Rayyan"],
      language: "en",
      locationPhrase: "Doha or Qatar",
      districtLabel: "district or free zone if known, else empty string",
      adjacentMarkets: ["Dubai", "Riyadh", "Abu Dhabi"],
      timezone: "Asia/Qatar",
      districts: [
        { name: "West Bay", sectorTags: ["financial services", "energy", "corporate hq"] },
        { name: "Qatar Financial Centre", sectorTags: ["banking", "fintech", "professional services"] },
        { name: "Lusail", sectorTags: ["real estate", "hospitality", "technology"] },
        { name: "Education City", sectorTags: ["education", "research", "healthcare"] },
      ],
    },
  },
  {
    id: "singapore-apac",
    name: "Singapore / APAC",
    description: "Regional HQ magnet — CBD, Marina Bay, Jurong",
    demandDrivers: [
      "MAS and PDPA regulated-industry AI",
      "Regional HQ consolidation into Singapore",
      "Smart Nation / digital economy programmes",
    ],
    market: {
      region: "Singapore",
      country: "Singapore",
      countryCode: "SG",
      primaryCity: "Singapore",
      cities: ["Singapore"],
      language: "en",
      locationPhrase: "Singapore or ASEAN regional headquarters based in Singapore",
      districtLabel: "district or business park if known, else empty string",
      adjacentMarkets: ["Kuala Lumpur", "Jakarta", "Hong Kong", "Sydney"],
      timezone: "Asia/Singapore",
      districts: [
        { name: "CBD / Raffles Place", sectorTags: ["financial services", "banking", "insurance"] },
        { name: "Marina Bay", sectorTags: ["financial services", "technology", "corporate hq"] },
        { name: "one-north / Fusionopolis", sectorTags: ["technology", "biotech", "research"] },
        { name: "Jurong", sectorTags: ["manufacturing", "logistics", "energy"] },
      ],
    },
  },
  {
    id: "sydney-au",
    name: "Sydney / Australia",
    description: "ANZ enterprise — CBD, North Sydney, Macquarie Park",
    demandDrivers: [
      "APRA CPS 230 / data resilience",
      "Australian AI Ethics & safety regulation",
      "Cloud repatriation and lakehouse modernisation",
    ],
    market: {
      region: "Australia",
      country: "Australia",
      countryCode: "AU",
      primaryCity: "Sydney",
      cities: ["Sydney", "Parramatta", "North Sydney"],
      language: "en",
      locationPhrase: "Sydney or New South Wales, Australia",
      districtLabel: "suburb or business precinct if known, else empty string",
      adjacentMarkets: ["Melbourne", "Brisbane", "Auckland"],
      timezone: "Australia/Sydney",
      districts: [
        { name: "Sydney CBD", sectorTags: ["financial services", "banking", "insurance", "professional services"] },
        { name: "North Sydney", sectorTags: ["technology", "telecom", "corporate hq"] },
        { name: "Macquarie Park", sectorTags: ["technology", "pharma", "education"] },
        { name: "Barangaroo", sectorTags: ["financial services", "corporate hq"] },
      ],
    },
  },
  {
    id: "melbourne-au",
    name: "Melbourne / Australia",
    description: "ANZ secondary hub — Docklands, CBD, Parkville",
    demandDrivers: [
      "Victorian digital economy programmes",
      "Health & research data platforms",
      "APRA / privacy-driven modernisation",
    ],
    market: {
      region: "Australia",
      country: "Australia",
      countryCode: "AU",
      primaryCity: "Melbourne",
      cities: ["Melbourne", "Geelong"],
      language: "en",
      locationPhrase: "Melbourne or Victoria, Australia",
      districtLabel: "suburb or business precinct if known, else empty string",
      adjacentMarkets: ["Sydney", "Adelaide", "Brisbane"],
      timezone: "Australia/Melbourne",
      districts: [
        { name: "Melbourne CBD", sectorTags: ["financial services", "professional services", "government"] },
        { name: "Docklands", sectorTags: ["telecom", "media", "corporate hq"] },
        { name: "Parkville", sectorTags: ["healthcare", "pharma", "education", "research"] },
        { name: "CreMorne / Richmond", sectorTags: ["technology", "saas"] },
      ],
    },
  },
  {
    id: "brisbane-au",
    name: "Brisbane / Australia",
    description: "QLD enterprise — CBD, Fortitude Valley, resources & gov",
    demandDrivers: [
      "Queensland digital economy and energy transition",
      "Government and health data platform modernisation",
      "Resources / infrastructure AI and analytics demand",
    ],
    market: {
      region: "Australia",
      country: "Australia",
      countryCode: "AU",
      primaryCity: "Brisbane",
      cities: ["Brisbane", "Gold Coast", "Sunshine Coast"],
      language: "en",
      locationPhrase: "Brisbane or Queensland, Australia",
      districtLabel: "suburb or business precinct if known, else empty string",
      adjacentMarkets: ["Sydney", "Melbourne", "Singapore"],
      timezone: "Australia/Brisbane",
      districts: [
        { name: "Brisbane CBD", sectorTags: ["financial services", "government", "professional services"] },
        { name: "Fortitude Valley", sectorTags: ["technology", "media", "saas"] },
        { name: "Australia TradeCoast", sectorTags: ["logistics", "aviation", "manufacturing"] },
        { name: "Spring Hill / Herston", sectorTags: ["healthcare", "education", "research"] },
      ],
    },
  },
  {
    id: "london-uk",
    name: "London / UK",
    description: "European HQ — City, Canary Wharf, Tech City",
    demandDrivers: [
      "UK AI opportunities action plan",
      "FCA / PRA operational resilience",
      "Post-Brexit data adequacy and cloud strategy",
    ],
    market: {
      region: "United Kingdom",
      country: "United Kingdom",
      countryCode: "GB",
      primaryCity: "London",
      cities: ["London", "Manchester", "Edinburgh"],
      language: "en",
      locationPhrase: "London or the wider United Kingdom",
      districtLabel: "borough, district, or business campus if known, else empty string",
      adjacentMarkets: ["Dublin", "Amsterdam", "Paris"],
      timezone: "Europe/London",
      districts: [
        { name: "City of London", sectorTags: ["financial services", "banking", "insurance"] },
        { name: "Canary Wharf", sectorTags: ["banking", "fintech", "corporate hq"] },
        { name: "Tech City / Shoreditch", sectorTags: ["technology", "saas", "media"] },
        { name: "King's Cross", sectorTags: ["technology", "ai", "research"] },
      ],
    },
  },
  {
    id: "montreal-ca",
    name: "Montreal / Canada",
    description: "AI research cluster — downtown, Mile-Ex, Quebec adjacency",
    demandDrivers: [
      "Quebec / federal AI investment programmes",
      "Bilingual enterprise data platforms",
      "Financial services modernisation (OSC / AMF)",
    ],
    market: {
      region: "Canada",
      country: "Canada",
      countryCode: "CA",
      primaryCity: "Montreal",
      cities: ["Montreal", "Quebec City", "Ottawa"],
      language: "en",
      locationPhrase: "Montreal or Quebec, Canada",
      districtLabel: "borough or business district if known, else empty string",
      adjacentMarkets: ["Toronto", "Ottawa", "Boston"],
      timezone: "America/Toronto",
      districts: [
        { name: "Downtown / Ville-Marie", sectorTags: ["financial services", "professional services"] },
        { name: "Mile-Ex / AI Mile", sectorTags: ["technology", "ai", "research"] },
        { name: "Old Montreal", sectorTags: ["hospitality", "retail", "corporate hq"] },
        { name: "West Island", sectorTags: ["aerospace", "manufacturing", "pharma"] },
      ],
    },
  },
  {
    id: "mumbai-in",
    name: "Mumbai / India",
    description: "BFSI & conglomerate hub — BKC, Nariman Point, Pune adjacency",
    demandDrivers: [
      "India DPDP Act compliance",
      "UPI / digital public infrastructure scale",
      "Enterprise GenAI and lakehouse adoption",
    ],
    market: {
      region: "India",
      country: "India",
      countryCode: "IN",
      primaryCity: "Mumbai",
      cities: ["Mumbai", "Pune", "Navi Mumbai", "Thane"],
      language: "en",
      locationPhrase: "Mumbai or Maharashtra, India",
      districtLabel: "locality or business district if known, else empty string",
      adjacentMarkets: ["Bengaluru", "Hyderabad", "Delhi NCR", "Pune"],
      timezone: "Asia/Kolkata",
      districts: [
        { name: "Bandra Kurla Complex", sectorTags: ["financial services", "banking", "corporate hq"] },
        { name: "Nariman Point / Fort", sectorTags: ["banking", "insurance", "professional services"] },
        { name: "Andheri / SEEPZ", sectorTags: ["technology", "outsourcing", "media"] },
        { name: "Pune", sectorTags: ["technology", "manufacturing", "automotive"] },
      ],
    },
  },
];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
