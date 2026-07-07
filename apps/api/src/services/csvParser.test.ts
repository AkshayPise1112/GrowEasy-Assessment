import { describe, expect, it } from "vitest";

import { chunkCandidates, parseCsvBuffer } from "./csvParser.js";

describe("parseCsvBuffer", () => {
  it("parses CSV rows and trims values", async () => {
    const buffer = Buffer.from(
      "Full Name,Email,Phone\n John Doe , john@example.com , +91 9876543210 \n\nJane Doe,jane@example.com,",
    );

    const { rows, skipped } = await parseCsvBuffer(buffer);

    expect(skipped).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      rowNumber: 1,
      source: {
        "Full Name": "John Doe",
        Email: "john@example.com",
        Phone: "+91 9876543210",
      },
    });
  });

  it("skips malformed rows and continues parsing", async () => {
    const buffer = Buffer.from(
      "name,email,phone\nAlice,alice@test.com,111\nBob,bob@test.com\nCarol,carol@test.com,333",
    );

    const { rows, skipped } = await parseCsvBuffer(buffer);

    expect(rows).toHaveLength(2);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.reason).toContain("CSV parse error");
    expect(skipped[0]?.source.raw_line).toContain("Bob,bob@test.com");
  });
});

describe("chunkCandidates", () => {
  it("creates bounded chunks", () => {
    expect(chunkCandidates([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});
