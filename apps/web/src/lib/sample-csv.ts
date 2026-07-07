export const requiredHeaders = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

export const sampleCsvUrl = "/sample.csv";

export async function downloadSampleCsv() {
  const response = await fetch(sampleCsvUrl);

  if (!response.ok) {
    throw new Error("Could not download the sample CSV template.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sample.csv";
  link.click();
  URL.revokeObjectURL(url);
}
