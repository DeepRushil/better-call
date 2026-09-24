// Vercel Serverless Function — secure API proxy for Groq
// The GROQ_API_KEY is stored in Vercel's environment variables (never in code)
module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("[NyAI] GROQ_API_KEY is not set in environment variables.");
    return res.status(500).json({ error: "Server configuration error: API key missing." });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error("[NyAI] Groq API call failed:", error.message);
    return res.status(500).json({ error: "Failed to reach Groq API: " + error.message });
  }
};
