// Vercel Serverless Function — secure Groq API proxy
// GROQ_API_KEY is stored in Vercel Environment Variables only — never in source code.

const MAX_PAYLOAD_BYTES = 50 * 1024; // 50 KB ceiling to prevent Denial of Service

module.exports = async function handler(req, res) {

  // Security headers on every response
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight
  if (req.method === "OPTIONS") return res.status(200).end();

  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Read API key from environment (never from code)
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[NyAI] GROQ_API_KEY environment variable is not set.");
    return res.status(500).json({ error: "Server configuration error: API key missing." });
  }

  // Safely parse the request body (supports both parsed object and raw JSON string)
  let body = req.body;
  if (typeof body === "string") {
    if (body.length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json({ error: "Payload Too Large: Maximum allowed size is 50 KB." });
    }
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: "Invalid JSON body." }); }
  } else if (body && JSON.stringify(body).length > MAX_PAYLOAD_BYTES) {
    return res.status(413).json({ error: "Payload Too Large: Maximum allowed size is 50 KB." });
  }

  // Validate that messages array is present
  if (!body || !body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Request body must contain a messages array." });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(body)
    });

    const data = await groqRes.json();
    return res.status(groqRes.status).json(data);

  } catch (err) {
    console.error("[NyAI] Groq API fetch failed:", err.message);
    return res.status(500).json({ error: "Groq API unreachable: " + err.message });
  }
};
