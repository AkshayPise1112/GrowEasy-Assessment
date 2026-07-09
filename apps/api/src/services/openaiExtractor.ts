import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import pRetry from "p-retry";

import type { CsvRecord, ExtractedCandidate, ImportCandidate, ParsedLead } from "../types.js";

const geminiModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const groqModel = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;
const groqClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

type ExtractionPayload = {
  items: Array<{
    rowNumber: number;
    confidence: "high" | "medium" | "low";
    extracted: Partial<Record<keyof ParsedLead, string>>;
  }>;
};

const systemPrompt = `
You map arbitrary CSV lead rows into the GrowEasy CRM schema.

Rules:
- Return valid JSON only, shaped as { "items": [...] }.
- Every item must include rowNumber, confidence, and extracted.
- Extract as many CRM fields as possible from the provided source row.
- Allowed crm_status values: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE.
- Allowed data_source values: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots. If unsure, leave it blank.
- created_at must be a date string that JavaScript can parse when possible.
- If you see multiple emails or mobile numbers, put the first into email/mobile_without_country_code and mention the rest in crm_note.
- Use crm_note for remarks, comments, extra phones, extra emails, follow-up notes, or overflow details.
- Keep each field as a single line string. Use escaped \\n when necessary.
- If a field is unavailable, return an empty string.
- Do not invent unsupported enum values.
- Respond with JSON only.
`.trim();

const extractionSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rowNumber: { type: "number" },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          extracted: {
            type: "object",
            properties: {
              created_at: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
              country_code: { type: "string" },
              mobile_without_country_code: { type: "string" },
              company: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              country: { type: "string" },
              lead_owner: { type: "string" },
              crm_status: { type: "string" },
              crm_note: { type: "string" },
              data_source: { type: "string" },
              possession_time: { type: "string" },
              description: { type: "string" },
            },
            additionalProperties: false,
          },
        },
        required: ["rowNumber", "confidence", "extracted"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

const heuristicKeywordMap: Array<[keyof ParsedLead, string[]]> = [
  ["created_at", ["created", "date", "timestamp", "time"]],
  ["name", ["name", "full_name", "customer", "lead_name"]],
  ["email", ["email", "mail"]],
  ["country_code", ["country_code", "dial_code", "isd"]],
  ["mobile_without_country_code", ["mobile", "phone", "contact", "telephone", "whatsapp"]],
  ["company", ["company", "organization", "business"]],
  ["city", ["city"]],
  ["state", ["state", "province"]],
  ["country", ["country"]],
  ["lead_owner", ["owner", "assigned", "sales_rep"]],
  ["crm_status", ["status", "lead_status"]],
  ["crm_note", ["note", "remark", "comment", "message"]],
  ["data_source", ["source", "channel", "campaign"]],
  ["possession_time", ["possession"]],
  ["description", ["description", "details", "summary"]],
];

function heuristicExtract(row: CsvRecord): Partial<ParsedLead> {
  const extracted: Partial<ParsedLead> = {};
  const entries = Object.entries(row);

  heuristicKeywordMap.forEach(([field, keywords]) => {
    const match = entries.find(([key]) =>
      keywords.some((keyword) => key.toLowerCase().includes(keyword)),
    );

    if (match) {
      extracted[field] = match[1] as never;
    }
  });

  return extracted;
}

function coercePayload(payload: unknown, batch: ImportCandidate[]): ExtractedCandidate[] {
  if (!payload || typeof payload !== "object" || !("items" in payload)) {
    return batch.map((item) => ({
      rowNumber: item.rowNumber,
      confidence: "low",
      extracted: heuristicExtract(item.source),
    }));
  }

  const items = Array.isArray((payload as ExtractionPayload).items)
    ? (payload as ExtractionPayload).items
    : [];

  return batch.map((item) => {
    const matched = items.find((candidate) => candidate.rowNumber === item.rowNumber);

    return {
      rowNumber: item.rowNumber,
      confidence: matched?.confidence ?? "low",
      extracted: matched?.extracted ?? heuristicExtract(item.source),
    };
  });
}

async function extractWithGemini(batch: ImportCandidate[]) {
  if (!geminiClient) {
    throw new Error("Gemini API key is not configured.");
  }

  const payload = {
    headers: [...new Set(batch.flatMap((item) => Object.keys(item.source)))],
    rows: batch,
  };

  const response = await geminiClient.models.generateContent({
    model: geminiModel,
    contents: `${systemPrompt}\n\nInput:\n${JSON.stringify(payload)}`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: extractionSchema,
      temperature: 0.1,
    },
  });

  return coercePayload(JSON.parse(response.text ?? "{}"), batch);
}

async function extractWithGroq(batch: ImportCandidate[]) {
  if (!groqClient) {
    throw new Error("Groq API key is not configured.");
  }

  const payload = {
    headers: [...new Set(batch.flatMap((item) => Object.keys(item.source)))],
    rows: batch,
  };

  const response = await groqClient.chat.completions.create({
    model: groqModel,
    temperature: 0.1,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  return coercePayload(JSON.parse(content), batch);
}

export async function extractBatch(batch: ImportCandidate[]): Promise<ExtractedCandidate[]> {
  if (batch.length === 0) {
    return [];
  }

  if (!geminiClient && !groqClient) {
    return batch.map((item) => ({
      rowNumber: item.rowNumber,
      confidence: "low",
      extracted: heuristicExtract(item.source),
    }));
  }

  return pRetry(
    async () => {
      if (groqClient) {
        try {
          return await extractWithGroq(batch);
        } catch (groqError) {
          if (!geminiClient) {
            throw groqError;
          }
        }
      }

      return extractWithGemini(batch);
    },
    {
      retries: 2,
      minTimeout: 700,
      maxTimeout: 2000,
    },
  );
}
