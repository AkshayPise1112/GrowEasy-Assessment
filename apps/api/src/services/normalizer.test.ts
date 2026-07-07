import { describe, expect, it } from "vitest";

import { normalizeLead } from "./normalizer.js";

describe("normalizeLead", () => {
  it("keeps the first email and phone and moves extras into crm_note", () => {
    const result = normalizeLead(
      {
        rowNumber: 3,
        confidence: "high",
        extracted: {
          name: "Priya Singh",
          email: "priya@example.com alt@example.com",
          mobile_without_country_code: "+91 9876543210 / 9123456789",
          crm_note: "Requested call back",
          crm_status: "good lead follow up",
          data_source: "eden_park",
          created_at: "29-06-2026 10:00",
        },
      },
      {
        notes: "Extra context",
      },
    );

    expect(result.lead).toMatchObject({
      name: "Priya Singh",
      email: "priya@example.com",
      mobile_without_country_code: "919876543210",
      country_code: "+91",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
      data_source: "eden_park",
    });
    expect(result.lead?.crm_note).toContain("Extra emails: alt@example.com");
    expect(result.lead?.crm_note).toContain("Extra mobiles: 9123456789");
  });

  it("skips rows without primary email or mobile", () => {
    const result = normalizeLead(
      {
        rowNumber: 8,
        confidence: "low",
        extracted: {
          name: "Missing Contact",
        },
      },
      {
        company: "GrowEasy",
      },
    );

    expect(result.lead).toBeUndefined();
    expect(result.skipped?.reason).toContain("neither an email nor a mobile number");
  });
});
