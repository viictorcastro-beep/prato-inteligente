app.get('/health', (req, res) => res.status(200).send('ok'));

const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash"; // modelo estável

app.post("/api/analisar-refeicao", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ ok: false, error: "prompt vazio" });
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ ok: false, error: "GEMINI_API_KEY não configurada" });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }]}] })
    });

    const j = await r.json();

    // Se a API respondeu erro, propague-o para o front
    if (!r.ok) {
      console.error("Gemini ERROR:", j);
      return res.status(r.status).json({ ok: false, error: j?.error?.message || "Erro na API Gemini" });
    }

    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini sem texto:", j);
      return res.status(502).json({ ok: false, error: "Sem texto na resposta do modelo" });
    }

    return res.json({ ok: true, text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("Server rodando na porta", process.env.PORT || 3000)
);
