import { Router } from "express";
import multer from "multer";

import { chunkCandidates, parseCsvBuffer } from "../services/csvParser.js";
import { normalizeLead } from "../services/normalizer.js";
import { extractBatch } from "../services/openaiExtractor.js";
import type { ImportResult } from "../types.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const importRouter = Router();

importRouter.post("/stream", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Please upload a CSV file." });
      return;
    }

    const { rows, skipped: parseSkipped } = await parseCsvBuffer(req.file.buffer);

    if (rows.length === 0 && parseSkipped.length === 0) {
      res.status(400).json({ message: "The uploaded CSV did not contain any usable rows." });
      return;
    }

    const batches = chunkCandidates(rows, 8);
    const records: ImportResult["records"] = [];
    const skipped: ImportResult["skipped"] = [...parseSkipped];

    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const writeEvent = (event: object) => {
      res.write(`${JSON.stringify(event)}\n`);
    };

    writeEvent({
      type: "progress",
      message:
        parseSkipped.length > 0
          ? `CSV parsed with ${parseSkipped.length} malformed row(s) skipped. Starting AI extraction.`
          : "CSV parsed successfully. Starting AI extraction.",
      processedBatches: 0,
      totalBatches: batches.length,
      importedCount: 0,
      skippedCount: skipped.length,
    });

    for (const [index, batch] of batches.entries()) {
      const extracted = await extractBatch(batch);

      extracted.forEach((candidate) => {
        const source = batch.find((item) => item.rowNumber === candidate.rowNumber)?.source;

        if (!source) {
          return;
        }

        const normalized = normalizeLead(candidate, source);

        if (normalized.lead) {
          records.push(normalized.lead);
        }

        if (normalized.skipped) {
          skipped.push(normalized.skipped);
        }
      });

      writeEvent({
        type: "progress",
        message: `Processed batch ${index + 1} of ${batches.length}.`,
        processedBatches: index + 1,
        totalBatches: batches.length,
        importedCount: records.length,
        skippedCount: skipped.length,
      });
    }

    writeEvent({
      type: "result",
      summary: {
        totalRows: rows.length + parseSkipped.length,
        importedCount: records.length,
        skippedCount: skipped.length,
        processedBatches: batches.length,
        totalBatches: batches.length,
      },
      records,
      skipped,
    });

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
      return;
    }

    res.write(
      `${JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Import failed unexpectedly.",
      })}\n`,
    );
    res.end();
  }
});
