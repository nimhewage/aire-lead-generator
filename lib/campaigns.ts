/**
 * Campaign / inventory accessors.
 * Prefer Supabase via lib/store; disk JSON remains a local fallback.
 */
export {
  activateCampaign,
  cloneCampaign,
  createCampaignFromTemplate,
  getActiveCampaign,
  getCampaign,
  inventoryForCampaign,
  listCampaigns,
  listMarketTemplates,
  normalizeCampaign,
  saveCampaign,
  upsertLeads,
  parseCsv,
} from "./store";
