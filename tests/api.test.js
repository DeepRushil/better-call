/**
 * @fileoverview Unit tests for the Vercel serverless API handler (api/chat.js).
 * Tests cover: HTTP method validation, missing env vars, body validation, and error handling.
 * Run with: npm test
 */

const handler = require("../api/chat");

// ============================================================
// Mock fetch globally for all tests
// ============================================================
global.fetch = jest.fn();

// Helper to create a mock response object
function mockRes() {
  const res = {
    _status: null,
    _body: null,
    _headers: {},
    status(code) { this._status = code; return this; },
    json(body)   { this._body = body; return this; },
    end()        { return this; },
    setHeader(k, v) { this._headers[k] = v; }
  };
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.GROQ_API_KEY = "gsk_test_key_for_unit_tests";
});

afterEach(() => {
  delete process.env.GROQ_API_KEY;
});

// ============================================================
// HTTP Method Validation
// ============================================================
describe("HTTP method validation", () => {
  test("returns 405 for GET requests", async () => {
    const req = { method: "GET", body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
    expect(res._body.error).toMatch(/Method Not Allowed/i);
  });

  test("returns 405 for PUT requests", async () => {
    const req = { method: "PUT", body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  test("returns 200 for OPTIONS preflight (CORS)", async () => {
    const req = { method: "OPTIONS" };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
  });
});

// ============================================================
// Environment Variable Validation
// ============================================================
describe("API key environment variable", () => {
  test("returns 500 when GROQ_API_KEY is not set", async () => {
    delete process.env.GROQ_API_KEY;
    const req = { method: "POST", body: { messages: [{ role: "user", content: "hi" }] } };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/API key missing/i);
  });
});

// ============================================================
// Request Body Validation
// ============================================================
describe("Request body validation", () => {
  test("returns 400 when body has no messages array", async () => {
    const req = { method: "POST", body: {} };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/messages/i);
  });

  test("returns 400 when body is null", async () => {
    const req = { method: "POST", body: null };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  test("parses JSON string body correctly", async () => {
    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ choices: [{ message: { content: "Hello" } }] })
    });
    const req = {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] })
    };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
  });
});

// ============================================================
// Groq API Proxy Behaviour
// ============================================================
describe("Groq API proxy", () => {
  test("forwards 200 response from Groq correctly", async () => {
    const mockData = { choices: [{ message: { content: "Article 21 protects..." } }] };
    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockData
    });
    const req = {
      method: "POST",
      body: { messages: [{ role: "user", content: "Explain Article 21" }] }
    };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body).toEqual(mockData);
  });

  test("forwards 429 rate limit error from Groq", async () => {
    global.fetch.mockResolvedValueOnce({
      status: 429,
      json: async () => ({ error: { message: "Rate limit exceeded" } })
    });
    const req = {
      method: "POST",
      body: { messages: [{ role: "user", content: "test" }] }
    };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(429);
  });

  test("returns 500 when fetch throws a network error", async () => {
    global.fetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const req = {
      method: "POST",
      body: { messages: [{ role: "user", content: "test" }] }
    };
    const res = mockRes();
    await handler(req, res);
    expect(res._status).toBe(500);
    expect(res._body.error).toMatch(/ECONNREFUSED/);
  });

  test("sets Authorization header with API key on Groq call", async () => {
    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ choices: [] })
    });
    const req = {
      method: "POST",
      body: { messages: [{ role: "user", content: "test" }] }
    };
    const res = mockRes();
    await handler(req, res);
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer gsk_test_key_for_unit_tests");
  });
});

// ============================================================
// Security Headers
// ============================================================
describe("Security headers", () => {
  test("sets X-Content-Type-Options header", async () => {
    const req = { method: "POST", body: { messages: [] } };
    const res = mockRes();
    await handler(req, res);
    expect(res._headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  test("sets X-Frame-Options header", async () => {
    const req = { method: "POST", body: { messages: [] } };
    const res = mockRes();
    await handler(req, res);
    expect(res._headers["X-Frame-Options"]).toBe("DENY");
  });
});
