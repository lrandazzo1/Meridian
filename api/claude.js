// Vercel serverless function — proxies Claude API calls.
// Your ANTHROPIC_API_KEY lives here (server-side), never in the browser.

export default async function handler(req, res) {
  // CORS (so the PWA can call this)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    const { system, messages, max_tokens } = req.body || {};
    if (!messages) return res.status(400).json({ error: "messages required" });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: max_tokens || 1500,
        system: system || undefined,
        messages
      })
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Anthropic API error:", data);
      return res.status(r.status).json({ error: data?.error?.message || "Anthropic API error" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
}
