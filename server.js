const express = require("express");
const cors = require("cors");
// Node 22 já tem fetch nativo → não precisa do node-fetch


const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // defina no ambiente
const GEMINI_MODEL  = "gemini-2.0-flash";

app.post("/api/analisar-refeicao", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt ausente" });

    const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      return res.status(r.status).json({ error: "Gemini falhou", detail: await r.text() });
    }

    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta";
    res.json({ ok: true, text });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: String(e) });
  }
});

app.listen(3000, () => console.log("🚀 API rodando em http://localhost:3000"));
