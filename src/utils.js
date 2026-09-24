/**
 * @fileoverview Pure utility functions for the Better Call platform.
 * Extracted into a separate module to enable unit testing in Node.js environments.
 * All functions are side-effect free and have no DOM or browser dependencies.
 */

// ============================================================
// CONSTANTS
// ============================================================
const RATE_LIMIT_MAX  = 10;
const RATE_LIMIT_MS   = 60000;
const MAX_INPUT_CHARS = 8000;
const MAX_CHAT_CHARS  = 2000;
const GROQ_MODEL      = "openai/gpt-oss-20b";

// ============================================================
// XSS SANITIZER (Security)
// Uses pure string replacement — no DOM dependency, fully testable.
// ============================================================
/**
 * Escapes HTML entities in raw text to prevent XSS injection.
 * @param {string} text - Raw unsanitized text
 * @returns {string} HTML-entity-escaped string
 */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Escapes HTML then applies safe markdown transforms.
 * Safe against XSS — all HTML is escaped before markdown is applied.
 * @param {string} text - Raw AI or user text
 * @returns {string} Safe HTML string for DOM insertion
 */
function sanitizeAndFormat(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n- /g, "<br>&bull; ")
    .replace(/\n(\d+)\. /g, (_, n) => "<br>" + n + ". ")
    .replace(/\n/g, "<br>");
}

// ============================================================
// RATE LIMITER (Security + Efficiency)
// ============================================================
/**
 * Creates a new rate limiter instance.
 * Extracted as a factory for testability.
 * @param {number} maxRequests - Maximum requests allowed per window
 * @param {number} windowMs    - Time window in milliseconds
 * @returns {{ check: () => boolean, reset: () => void, count: () => number }}
 */
function createRateLimiter(maxRequests, windowMs) {
  let requests = [];
  return {
    /** @returns {boolean} true if request is within limit, false if blocked */
    check() {
      const now = Date.now();
      requests = requests.filter(t => now - t < windowMs);
      if (requests.length >= maxRequests) return false;
      requests.push(now);
      return true;
    },
    /** Resets the request log (useful for testing) */
    reset() { requests = []; },
    /** @returns {number} current number of requests in window */
    count() {
      const now = Date.now();
      requests = requests.filter(t => now - t < windowMs);
      return requests.length;
    }
  };
}

// ============================================================
// INPUT VALIDATION (Code Quality + Security)
// ============================================================
/**
 * Validates user input before sending to the AI API.
 * @param {string} text      - User input string
 * @param {number} maxLength - Maximum allowed character length
 * @returns {{ valid: boolean, error?: string }}
 */
function validateInput(text, maxLength) {
  if (typeof text !== "string") {
    return { valid: false, error: "Input must be a string." };
  }
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false, error: "Input cannot be empty." };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: "Input exceeds maximum length of " + maxLength + " characters." };
  }
  return { valid: true };
}

/**
 * Truncates text to a maximum safe length for API calls.
 * @param {string} text   - Input text
 * @param {number} maxLen - Maximum character count
 * @returns {string} Truncated text
 */
function truncateToLimit(text, maxLen) {
  return typeof text === "string" ? text.slice(0, maxLen) : "";
}

// ============================================================
// RESPONSE CACHE (Efficiency)
// Simple LRU-like cache to avoid redundant API calls.
// ============================================================
/**
 * Creates a bounded response cache.
 * @param {number} maxSize - Maximum number of cached entries
 * @returns {{ get: Function, set: Function, has: Function, clear: Function, size: Function }}
 */
function createResponseCache(maxSize) {
  const cache = new Map();
  return {
    /** @param {string} key @returns {string|undefined} */
    get(key) { return cache.get(key); },

    /** @param {string} key @param {string} value */
    set(key, value) {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },

    /** @param {string} key @returns {boolean} */
    has(key) { return cache.has(key); },

    /** Clears all cached entries */
    clear() { cache.clear(); },

    /** @returns {number} current number of cached entries */
    size() { return cache.size; }
  };
}

// ============================================================
// NODE.JS EXPORT (for Jest tests)
// Browser usage: functions are globally available via <script> tag
// ============================================================
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizeAndFormat,
    createRateLimiter,
    validateInput,
    truncateToLimit,
    createResponseCache,
    RATE_LIMIT_MAX,
    RATE_LIMIT_MS,
    MAX_INPUT_CHARS,
    MAX_CHAT_CHARS,
    GROQ_MODEL
  };
}
