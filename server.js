const express = require("express");
const cors = require("cors");

// Fallback: usa fetch nativo se existir; senão carrega node-fetch.
const fetch =
  global.fetch ||
  ((...args) => import("node-fetch").then(({ default: f }) => f(...args)));

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// Health check p/ Render (opcional, mas ajuda)
app.get("/health", (req, res) => res.status(200).send("ok"));

// ===== SUA ROTA DA IA =====
app.post("/api/analisar-refeicao", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ ok: false, error: "prompt vazio" });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ ok: false, error: "GEMINI_API_KEY não configurada" });
  }

  const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      })
    });

    const j = await r.json();

    if (!r.ok) {
      console.error("Gemini ERROR:", j);
      return res.status(r.status).json({ ok: false, error: j.error?.message || "Erro na API Gemini" });
    }

    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta do modelo.";
    return res.json({ ok: true, text });
  } catch (err) {
    console.error("Falha geral:", err);
    return res.status(500).json({ ok: false, error: "Falha geral ao chamar a IA" });
  }
});

// Porta: **sempre** usar a do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server rodando na porta ${PORT}`);
});

// Logs que evitam queda silenciosa
process.on("uncaughtException", (e) => {
  console.error("uncaughtException:", e);
});
process.on("unhandledRejection", (p) => {
  console.error("unhandledRejection:", p);
});
