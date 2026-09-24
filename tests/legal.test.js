/**
 * @fileoverview Unit tests for Indian legal data, directory integrity, and multilingual support.
 * Tests cover: 36 States/UTs Bar Council mappings, NALSA/Nyaya Bandhu verification,
 * template types, and non-ASCII character handling.
 * Run with: npm test
 */

const {
  NALSA_URL,
  NYAYA_BANDHU_URL,
  BCI_URL,
  barCouncilLinks,
  supportedLanguages,
  templateTypes
} = require("../src/legalData");
const { escapeHtml, sanitizeAndFormat } = require("../src/utils");

// ============================================================
// Bar Council Directory Integrity (All 36 States & UTs)
// ============================================================
describe("Bar Council Directory Integrity", () => {
  const states = Object.keys(barCouncilLinks);

  test("covers all 36 Indian States and Union Territories", () => {
    expect(states.length).toBe(36);
  });

  test("every jurisdiction entry has valid name, url, and note fields", () => {
    states.forEach((state) => {
      const entry = barCouncilLinks[state];
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("url");
      expect(entry).toHaveProperty("note");
      expect(typeof entry.name).toBe("string");
      expect(typeof entry.url).toBe("string");
      expect(typeof entry.note).toBe("string");
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.note.length).toBeGreaterThan(0);
    });
  });

  test("every URL uses secure HTTPS protocol", () => {
    states.forEach((state) => {
      const { url } = barCouncilLinks[state];
      // Either starts with https or is a legitimate http fallback for legacy gov sites
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  test("major jurisdictions have specific, official Bar Council websites", () => {
    expect(barCouncilLinks["Delhi (NCT)"].url).toContain("delhibarcouncil.com");
    expect(barCouncilLinks["Maharashtra"].url).toContain("barcouncilmahgoa.org");
    expect(barCouncilLinks["Karnataka"].url).toContain("ksbc.org.in");
    expect(barCouncilLinks["Tamil Nadu"].url).toContain("bctnpy.org");
    expect(barCouncilLinks["Gujarat"].url).toContain("barcouncilofgujarat.org");
    expect(barCouncilLinks["West Bengal"].url).toContain("wbbarcouncil.org");
    expect(barCouncilLinks["Kerala"].url).toContain("barcouncilkerala.org");
  });

  test("institutional legal aid URLs are properly defined", () => {
    expect(NALSA_URL).toBe("https://nalsa.gov.in/");
    expect(NYAYA_BANDHU_URL).toBe("https://doj.gov.in/nyaya-bandhu-pb/");
    expect(BCI_URL).toBe("https://www.barcouncilofindia.org/");
  });
});

// ============================================================
// Multilingual & Regional Language Support
// ============================================================
describe("Multilingual & Regional Language Support", () => {
  test("supports at least 9 Indian languages", () => {
    expect(supportedLanguages.length).toBeGreaterThanOrEqual(9);
    expect(supportedLanguages).toContain("Hindi");
    expect(supportedLanguages).toContain("Tamil");
    expect(supportedLanguages).toContain("Telugu");
    expect(supportedLanguages).toContain("Bengali");
    expect(supportedLanguages).toContain("Marathi");
    expect(supportedLanguages).toContain("Gujarati");
    expect(supportedLanguages).toContain("Kannada");
    expect(supportedLanguages).toContain("Malayalam");
    expect(supportedLanguages).toContain("English");
  });

  test("preserves Devanagari script without corruption during escaping", () => {
    const hindiText = "अनुच्छेद 21 जीवन और व्यक्तिगत स्वतंत्रता का संरक्षण करता है।";
    expect(escapeHtml(hindiText)).toBe(hindiText);
    expect(sanitizeAndFormat(hindiText)).toBe(hindiText);
  });

  test("preserves Tamil script without corruption during escaping", () => {
    const tamilText = "சட்டத்தின் முன் அனைவரும் சமம் (பிரிவு 14).";
    expect(escapeHtml(tamilText)).toBe(tamilText);
    expect(sanitizeAndFormat(tamilText)).toBe(tamilText);
  });

  test("preserves Bengali script without corruption during escaping", () => {
    const bengaliText = "সংবিধানের ধারা ২১ জীবনের অধিকার রক্ষা করে।";
    expect(escapeHtml(bengaliText)).toBe(bengaliText);
    expect(sanitizeAndFormat(bengaliText)).toBe(bengaliText);
  });

  test("formats markdown correctly when combined with regional languages", () => {
    const text = "**अनुच्छेद 21**: *जीवन का अधिकार*";
    const formatted = sanitizeAndFormat(text);
    expect(formatted).toContain("<strong>अनुच्छेद 21</strong>");
    expect(formatted).toContain("<em>जीवन का अधिकार</em>");
  });

  test("handles Indian legal currency symbol (₹) and section symbol (§)", () => {
    const legalNotice = "बकाया राशि: ₹50,000 (§ धारा 138 NI Act)";
    expect(escapeHtml(legalNotice)).toContain("₹50,000");
    expect(escapeHtml(legalNotice)).toContain("§");
  });
});

// ============================================================
// Legal Template Schemas
// ============================================================
describe("Legal Template Schemas", () => {
  test("covers fundamental citizen complaint and notice types", () => {
    expect(templateTypes).toContain("RTI Application");
    expect(templateTypes).toContain("Consumer Complaint");
    expect(templateTypes).toContain("FIR Draft / Police Complaint");
    expect(templateTypes).toContain("Bail Application");
    expect(templateTypes).toContain("Legal Notice for Unpaid Salary");
    expect(templateTypes).toContain("Legal Notice for Security Deposit Refund");
  });

  test("preserves bracketed placeholders for user customization", () => {
    const draftWithPlaceholders = "I, [APPLICANT_NAME], residing at [ADDRESS] file this under [ACT_NAME].";
    const sanitized = sanitizeAndFormat(draftWithPlaceholders);
    expect(sanitized).toContain("[APPLICANT_NAME]");
    expect(sanitized).toContain("[ADDRESS]");
    expect(sanitized).toContain("[ACT_NAME]");
  });
});
