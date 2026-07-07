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

export type CsvRecord = Record<string, string>;

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
  source: CsvRecord;
};

export type ImportCandidate = {
  rowNumber: number;
  source: CsvRecord;
};

export type ExtractedCandidate = {
  rowNumber: number;
  extracted: Partial<Record<keyof ParsedLead, string>>;
  confidence: "high" | "medium" | "low";
};

export type ImportSummary = {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  processedBatches: number;
  totalBatches: number;
};

export type ImportResult = {
  summary: ImportSummary;
  records: ParsedLead[];
  skipped: SkippedRecord[];
};
