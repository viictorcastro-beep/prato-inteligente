import express from "express";
import cors from "cors";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = process.cwd();

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve o public/index.html e assets

app.post("/api/analisar-refeicao", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ ok: false, error: "prompt vazio" });

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }]}]
        })
      }
    );

    const j = await resp.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta do modelo.";
    res.json({ ok: true, text });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// fallback pra abrir o app no "/"
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
