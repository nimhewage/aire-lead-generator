import {
  activateCampaign,
  createCampaignFromTemplate,
  getCampaign,
  importLegacyLeadFile,
  inventoryForCampaign,
  listCampaigns,
  saveCampaign,
} from "../lib/campaigns";

const AW = "/Users/nim/LeadMinior/agentworks/output";

const markets = [
  {
    templateId: "sydney-au",
    id: "sydney-aire",
    pipeline: "sydney",
    file: `${AW}/leads-sydney.csv`,
  },
  {
    templateId: "melbourne-au",
    id: "melbourne-aire",
    pipeline: "melbourne",
    file: `${AW}/leads-melbourne.csv`,
  },
  {
    templateId: "brisbane-au",
    id: "brisbane-aire",
    pipeline: "brisbane",
    file: `${AW}/leads-brisbane.csv`,
  },
] as const;

for (const m of markets) {
  let campaign = getCampaign(m.id);
  if (!campaign) {
    campaign = createCampaignFromTemplate(m.templateId, {
      id: m.id,
      activate: false,
    });
    console.log("created", campaign.id);
  } else {
    console.log("exists", campaign.id);
  }
  campaign.runtime.pipeline = m.pipeline;
  campaign = saveCampaign(campaign);
  const dest = importLegacyLeadFile(m.pipeline, m.file);
  const inv = inventoryForCampaign(campaign);
  console.log(
    `  ${inv.leadCount} leads · ${inv.withContacts} contacts → ${dest}`
  );
}

if (getCampaign("dubai-aire")) {
  activateCampaign("dubai-aire");
}
console.log(
  "campaigns:",
  listCampaigns()
    .map((c) => c.id)
    .join(", ")
);
