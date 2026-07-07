import { Readable } from "node:stream";
import { parse, type Options } from "csv-parse";

import type { CsvRecord, ImportCandidate, SkippedRecord } from "../types.js";

const normalizeValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\r?\n/g, "\\n").trim();
};

export type ParseCsvResult = {
  rows: ImportCandidate[];
  skipped: SkippedRecord[];
};

export async function parseCsvBuffer(buffer: Buffer): Promise<ParseCsvResult> {
  const rows: ImportCandidate[] = [];
  const skipped: SkippedRecord[] = [];
  let rowIndex = 0;

  const parseOptions = {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    raw: true,
    skip_records_with_error: true,
    on_skip: (error: Error, rawLine?: string) => {
      const lineNumber =
        "lines" in error && typeof error.lines === "number"
          ? error.lines
          : rowIndex + 1;

      skipped.push({
        rowNumber: lineNumber,
        reason: `CSV parse error: ${error.message}`,
        source: {
          raw_line: rawLine?.trim() ?? "",
        },
      });
    },
  } as Options;

  const parser = Readable.from(buffer).pipe(parse(parseOptions));

  for await (const incoming of parser as AsyncIterable<Record<string, unknown>>) {
    rowIndex += 1;

    const record =
      typeof incoming.record === "object" && incoming.record !== null
        ? (incoming.record as Record<string, unknown>)
        : incoming;

    const normalized = Object.fromEntries(
      Object.entries(record)
        .filter(([key]) => key !== "raw" && key !== "record")
        .map(([key, value]) => [key.trim(), normalizeValue(value)]),
    ) as CsvRecord;

    if (Object.values(normalized).some(Boolean)) {
      rows.push({
        rowNumber: rowIndex,
        source: normalized,
      });
    }
  }

  return { rows, skipped };
}

export function chunkCandidates<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}
