import Papa from "papaparse";

import type { PreviewRow } from "@/lib/types";

export type CsvPreview = {
  columns: string[];
  rows: PreviewRow[];
  totalRows: number;
};

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

export const parseCsvPreview = (file: File, maxRows = 250): Promise<CsvPreview> =>
  new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0]?.message ?? "Failed to parse CSV."));
          return;
        }

        const rows = result.data
          .map((row, index) => {
            const values = Object.fromEntries(
              Object.entries(row).map(([key, value]) => [key.trim(), normalizeValue(value)]),
            );

            return {
              id: `preview-${index + 1}`,
              rowNumber: index + 1,
              values,
            } satisfies PreviewRow;
          })
          .filter((row) => Object.values(row.values).some(Boolean));

        const columnSet = new Set<string>();
        rows.forEach((row) => {
          Object.keys(row.values).forEach((column) => {
            if (column) {
              columnSet.add(column);
            }
          });
        });

        resolve({
          columns: [...columnSet],
          rows: rows.slice(0, maxRows),
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
