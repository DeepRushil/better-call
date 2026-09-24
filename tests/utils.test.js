/**
 * @fileoverview Unit tests for Better Call utility functions.
 * Tests cover: XSS sanitization, rate limiting, input validation,
 * response caching, and text truncation.
 * Run with: npm test
 */

const {
  escapeHtml,
  sanitizeAndFormat,
  createRateLimiter,
  validateInput,
  truncateToLimit,
  createResponseCache,
  RATE_LIMIT_MAX,
  RATE_LIMIT_MS,
  MAX_INPUT_CHARS,
  MAX_CHAT_CHARS
} = require("../src/utils");

// ============================================================
// escapeHtml — XSS Prevention
// ============================================================
describe("escapeHtml", () => {
  test("escapes <script> tags to prevent XSS", () => {
    const result = escapeHtml('<script>alert("xss")</script>');
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  test("escapes < and > characters", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  test("escapes & ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  test("escapes double quotes", () => {
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  test("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  test("returns plain text unchanged (no HTML chars)", () => {
    expect(escapeHtml("Hello NyAI")).toBe("Hello NyAI");
  });

  test("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("converts non-string input to string", () => {
    expect(escapeHtml(123)).toBe("123");
    expect(escapeHtml(null)).toBe("null");
  });

  test("makes event handler attributes inert by escaping the tag brackets", () => {
    const result = escapeHtml('<img onerror="alert(1)" src="x">');
    // The < and > are escaped — the browser never sees an HTML tag, just safe text
    expect(result).toContain("&lt;img");
    expect(result).not.toContain("<img");
    expect(result).not.toContain("<script");
  });
});

// ============================================================
// sanitizeAndFormat — Safe Markdown Renderer
// ============================================================
describe("sanitizeAndFormat", () => {
  test("converts **bold** to <strong>", () => {
    expect(sanitizeAndFormat("**bold text**")).toContain("<strong>bold text</strong>");
  });

  test("converts *italic* to <em>", () => {
    expect(sanitizeAndFormat("*italic text*")).toContain("<em>italic text</em>");
  });

  test("converts newline-dash to bullet point", () => {
    const result = sanitizeAndFormat("intro\n- item one");
    expect(result).toContain("&bull;");
    expect(result).toContain("item one");
  });

  test("converts numbered list prefix", () => {
    const result = sanitizeAndFormat("steps:\n1. first step");
    expect(result).toContain("1. first step");
  });

  test("converts newlines to <br> tags", () => {
    expect(sanitizeAndFormat("line1\nline2")).toContain("<br>");
  });

  test("does NOT inject raw HTML from AI response", () => {
    const malicious = '<script>alert("injected")</script>';
    const result = sanitizeAndFormat(malicious);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  test("escapes img onerror attack vector", () => {
    const attack = "<img src=x onerror=alert(1)>";
    const result = sanitizeAndFormat(attack);
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
  });

  test("handles plain text without markdown", () => {
    const result = sanitizeAndFormat("Plain text response.");
    expect(result).toBe("Plain text response.");
  });

  test("handles empty string", () => {
    expect(sanitizeAndFormat("")).toBe("");
  });
});

// ============================================================
// createRateLimiter — API Abuse Prevention
// ============================================================
describe("createRateLimiter", () => {
  test("allows requests within the limit", () => {
    const limiter = createRateLimiter(5, 60000);
    for (let i = 0; i < 5; i++) {
      expect(limiter.check()).toBe(true);
    }
  });

  test("blocks the request immediately after limit is reached", () => {
    const limiter = createRateLimiter(3, 60000);
    limiter.check();
    limiter.check();
    limiter.check();
    expect(limiter.check()).toBe(false);
  });

  test("reports correct count of requests in window", () => {
    const limiter = createRateLimiter(10, 60000);
    limiter.check();
    limiter.check();
    expect(limiter.count()).toBe(2);
  });

  test("resets correctly", () => {
    const limiter = createRateLimiter(2, 60000);
    limiter.check();
    limiter.check();
    expect(limiter.check()).toBe(false);
    limiter.reset();
    expect(limiter.check()).toBe(true);
  });

  test("default constants are reasonable values", () => {
    expect(RATE_LIMIT_MAX).toBeGreaterThan(0);
    expect(RATE_LIMIT_MAX).toBeLessThanOrEqual(100);
    expect(RATE_LIMIT_MS).toBeGreaterThanOrEqual(10000);
  });
});

// ============================================================
// validateInput — Input Safety
// ============================================================
describe("validateInput", () => {
  test("rejects empty string", () => {
    const result = validateInput("", 2000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test("rejects whitespace-only string", () => {
    const result = validateInput("   ", 2000);
    expect(result.valid).toBe(false);
  });

  test("rejects input exceeding maximum length", () => {
    const longInput = "a".repeat(2001);
    const result = validateInput(longInput, 2000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("2000");
  });

  test("accepts a valid question", () => {
    const result = validateInput("What are my rights under Article 21?", 2000);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("accepts input exactly at the limit", () => {
    const input = "a".repeat(2000);
    expect(validateInput(input, 2000).valid).toBe(true);
  });

  test("rejects non-string input", () => {
    expect(validateInput(null, 2000).valid).toBe(false);
    expect(validateInput(42, 2000).valid).toBe(false);
  });

  test("MAX_CHAT_CHARS constant is correctly bounded", () => {
    expect(MAX_CHAT_CHARS).toBeGreaterThan(0);
    expect(MAX_INPUT_CHARS).toBeGreaterThanOrEqual(MAX_CHAT_CHARS);
  });
});

// ============================================================
// truncateToLimit — Efficiency / Token Safety
// ============================================================
describe("truncateToLimit", () => {
  test("truncates text longer than the limit", () => {
    const long = "a".repeat(100);
    expect(truncateToLimit(long, 50)).toHaveLength(50);
  });

  test("does not alter text shorter than the limit", () => {
    expect(truncateToLimit("short", 100)).toBe("short");
  });

  test("handles non-string input gracefully", () => {
    expect(truncateToLimit(null, 100)).toBe("");
    expect(truncateToLimit(undefined, 100)).toBe("");
  });

  test("handles empty string", () => {
    expect(truncateToLimit("", 100)).toBe("");
  });
});

// ============================================================
// createResponseCache — Efficiency (Avoids Redundant API Calls)
// ============================================================
describe("createResponseCache", () => {
  test("stores and retrieves a cached response", () => {
    const cache = createResponseCache(10);
    cache.set("what is article 21?", "Article 21 guarantees...");
    expect(cache.get("what is article 21?")).toBe("Article 21 guarantees...");
  });

  test("returns undefined for a cache miss", () => {
    const cache = createResponseCache(10);
    expect(cache.get("unknown question")).toBeUndefined();
  });

  test("has() correctly reports cache presence", () => {
    const cache = createResponseCache(10);
    cache.set("key", "value");
    expect(cache.has("key")).toBe(true);
    expect(cache.has("other")).toBe(false);
  });

  test("evicts the oldest entry when max size is reached", () => {
    const cache = createResponseCache(3);
    cache.set("q1", "a1");
    cache.set("q2", "a2");
    cache.set("q3", "a3");
    cache.set("q4", "a4"); // Should evict q1
    expect(cache.has("q1")).toBe(false);
    expect(cache.has("q4")).toBe(true);
    expect(cache.size()).toBe(3);
  });

  test("clear() empties the cache", () => {
    const cache = createResponseCache(10);
    cache.set("key", "value");
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.has("key")).toBe(false);
  });

  test("size() returns correct count", () => {
    const cache = createResponseCache(10);
    expect(cache.size()).toBe(0);
    cache.set("a", "1");
    cache.set("b", "2");
    expect(cache.size()).toBe(2);
  });
});
