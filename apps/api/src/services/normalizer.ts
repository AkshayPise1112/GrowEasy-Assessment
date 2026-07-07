import { z } from "zod";

import {
  crmStatuses,
  dataSources,
  type CsvRecord,
  type ExtractedCandidate,
  type ParsedLead,
  type SkippedRecord,
} from "../types.js";

const parsedLeadSchema = z.object({
  created_at: z.string().catch(""),
  name: z.string().catch(""),
  email: z.string().catch(""),
  country_code: z.string().catch(""),
  mobile_without_country_code: z.string().catch(""),
  company: z.string().catch(""),
  city: z.string().catch(""),
  state: z.string().catch(""),
  country: z.string().catch(""),
  lead_owner: z.string().catch(""),
  crm_status: z.string().catch(""),
  crm_note: z.string().catch(""),
  data_source: z.string().catch(""),
  possession_time: z.string().catch(""),
  description: z.string().catch(""),
});

const statusMap = new Map(
  crmStatuses.flatMap((status) => [
    [status, status],
    [status.toLowerCase(), status],
    [status.replaceAll("_", " ").toLowerCase(), status],
  ]),
);

const dataSourceSet = new Set(dataSources);

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phoneRegex = /(?:\+?\d[\d\s().-]{7,}\d)/g;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const splitCandidates = (value: string, regex: RegExp) => {
  const matches = value.match(regex) ?? [];
  return [...new Set(matches.map((match) => normalizeWhitespace(match)))];
};

type ParsedLeadInput = z.infer<typeof parsedLeadSchema>;

const normalizeDate = (value: string) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return "";
  }

  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  const dayFirst = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(.*)$/);
  if (dayFirst) {
    const day = dayFirst[1] ?? "";
    const month = dayFirst[2] ?? "";
    const year = dayFirst[3] ?? "";
    const rest = dayFirst[4] ?? "";
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    const candidate = `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}${rest}`;
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return normalized;
};

const normalizeCountryCode = (value: string, primaryPhone: string) => {
  const direct = normalizeWhitespace(value);
  if (direct) {
    return direct.startsWith("+") ? direct : `+${direct.replace(/[^\d]/g, "")}`;
  }

  const phone = primaryPhone.replace(/[^\d+]/g, "");
  if (phone.startsWith("+")) {
    const countryPrefix = phone.slice(0, Math.max(3, phone.length - 10));
    return countryPrefix || "";
  }

  if (phone.length > 10) {
    const prefix = phone.slice(0, phone.length - 10);
    return prefix ? `+${prefix}` : "";
  }

  return "";
};

const normalizePhone = (value: string) => value.replace(/[^\d]/g, "");

const mergeNotes = (...values: Array<string | undefined>) =>
  values
    .map((value) => normalizeWhitespace(value ?? ""))
    .filter(Boolean)
    .join(" | ");

function inferFromSource(source: CsvRecord, fallback: ParsedLeadInput) {
  const sourceText = Object.entries(source)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");

  const emails = splitCandidates(`${fallback.email ?? ""} ${sourceText}`, emailRegex);
  const phones = splitCandidates(
    `${fallback.mobile_without_country_code ?? ""} ${sourceText}`,
    phoneRegex,
  );

  return {
    emails,
    phones,
  };
}

export function normalizeLead(
  candidate: ExtractedCandidate,
  source: CsvRecord,
): { lead?: ParsedLead; skipped?: SkippedRecord } {
  const parsed = parsedLeadSchema.parse(candidate.extracted);
  const inferred = inferFromSource(source, parsed);

  const [primaryEmail, ...extraEmails] = inferred.emails;
  const normalizedPhones = inferred.phones.map(normalizePhone).filter(Boolean);
  const [primaryPhone, ...extraPhones] = normalizedPhones;

  if (!primaryEmail && !primaryPhone) {
    return {
      skipped: {
        rowNumber: candidate.rowNumber,
        reason: "Skipped because the row has neither an email nor a mobile number.",
        source,
      },
    };
  }

  const rawStatus = normalizeWhitespace(parsed.crm_status);
  const rawSource = normalizeWhitespace(parsed.data_source).toLowerCase();

  const crmStatus =
    statusMap.get(rawStatus) ??
    statusMap.get(rawStatus.toLowerCase()) ??
    "";

  const dataSource = dataSourceSet.has(rawSource as (typeof dataSources)[number])
    ? (rawSource as (typeof dataSources)[number])
    : "";

  const crmNote = mergeNotes(
    parsed.crm_note,
    extraEmails.length > 0 ? `Extra emails: ${extraEmails.join(", ")}` : "",
    extraPhones.length > 0 ? `Extra mobiles: ${extraPhones.join(", ")}` : "",
  );

  return {
    lead: {
      created_at: normalizeDate(parsed.created_at),
      name: normalizeWhitespace(parsed.name),
      email: primaryEmail ?? "",
      country_code: normalizeCountryCode(parsed.country_code, primaryPhone ?? ""),
      mobile_without_country_code: primaryPhone ?? "",
      company: normalizeWhitespace(parsed.company),
      city: normalizeWhitespace(parsed.city),
      state: normalizeWhitespace(parsed.state),
      country: normalizeWhitespace(parsed.country),
      lead_owner: normalizeWhitespace(parsed.lead_owner),
      crm_status: crmStatus,
      crm_note: crmNote,
      data_source: dataSource,
      possession_time: normalizeWhitespace(parsed.possession_time),
      description: normalizeWhitespace(parsed.description),
    },
  };
}
