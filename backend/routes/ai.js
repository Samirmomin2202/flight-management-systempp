import express from "express";

const router = express.Router();

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: "OPENAI_API_KEY not configured on server" });
    }

    const { messages = [], context = {}, topic = "" } = req.body || {};

    const systemPrompt = `You are Flight Hub's AI assistant. Be concise and helpful.
Current topic: ${topic || "flights"}.
User context (JSON): ${JSON.stringify(context).slice(0, 4000)}
Use INR prices if discussing amounts. If giving examples, prefer real values from context when available.`;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      temperature: 0.3,
      max_tokens: 600,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ success: false, message: "Upstream error", detail: errText });
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || "";
    return res.json({ success: true, reply });
  } catch (e) {
    return res.status(500).json({ success: false, message: e?.message || "AI error" });
  }
});

export default router;









