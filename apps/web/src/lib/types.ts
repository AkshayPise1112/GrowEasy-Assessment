export const crmStatuses = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const dataSources = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof crmStatuses)[number];
export type DataSource = (typeof dataSources)[number];

export type PreviewRow = {
  id: string;
  rowNumber: number;
  values: Record<string, string>;
};

export type ParsedLead = {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus | "";
  crm_note: string;
  data_source: DataSource | "";
  possession_time: string;
  description: string;
};

export type SkippedRecord = {
  rowNumber: number;
  reason: string;
  source: Record<string, string>;
};

export type ImportSummary = {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  processedBatches: number;
  totalBatches: number;
};

export type ProgressEvent = {
  type: "progress";
  message: string;
  processedBatches: number;
  totalBatches: number;
  importedCount: number;
  skippedCount: number;
};

export type ResultEvent = {
  type: "result";
  summary: ImportSummary;
  records: ParsedLead[];
  skipped: SkippedRecord[];
};

export type ErrorEvent = {
  type: "error";
  message: string;
};

export type ImportStreamEvent = ProgressEvent | ResultEvent | ErrorEvent;
