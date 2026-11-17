try { require("dotenv").config(); } catch (e) {}
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const MODES = { general: 1, creative: 1, code: 1, study: 1, business: 1 };
function isValidLang(l) { return ["en", "ar", "fr", "es", "de"].includes(l); }
function cleanMessages(msgs) {
  if (!Array.isArray(msgs) || msgs.length === 0 || msgs.length > 20) return null;
  const out = [];
  for (const m of msgs) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string" || !m.content.trim() || m.content.length > 8000) return null;
    out.push({ role: m.role, content: m.content.trim() });
  }
  if (out[out.length - 1].role !== "user") return null;
  return out;
}
function buildSystemPrompt(mode, lang) {
  return `You are NEXO AI. Mode: ${mode}. Language: ${lang}. Answer clearly, helpfully, in the user's language.`;
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  }
}));

app.use("/api", (_req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
app.use("/api", express.json({ limit: "256kb", strict: true }));
app.use(express.static(PUBLIC_DIR, { extensions: ["html"], index: "index.html" }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." }
});

app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, app: "NEXO AI", aiConfigured: Boolean(process.env.AI_API_KEY && process.env.AI_MODEL) });
});

app.post("/api/chat", chatLimiter, async (req, res) => {
  const body = req.body || {};
  const messages = cleanMessages(body.messages);
  const mode = body.mode;
  const lang = body.lang === undefined ? "en" : body.lang;
  if (!messages) return res.status(400).json({ error: "Invalid message history." });
  if (typeof mode !== "string" || !Object.hasOwn(MODES, mode)) return res.status(400).json({ error: "Choose a valid assistant mode." });
  if (!isValidLang(lang)) return res.status(400).json({ error: "Choose a supported interface language." });

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.AI_MODEL || "gemini-2.0-flash";
  if (!apiKey || !model) return res.status(503).json({ code: "AI_NOT_CONFIGURED", error: "NEXO AI is not connected to a live AI provider yet." });

  const endpoint = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: buildSystemPrompt(mode, lang) }, ...messages],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) return res.status(502).json({ error: "The AI provider could not complete this request." });
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof reply !== "string" || !reply.trim()) return res.status(502).json({ error: "The AI provider returned an unsupported response format." });
    res.set("Cache-Control", "no-store");
    return res.json({ reply: reply.trim() });
  } catch (error) {
    return res.status(error && error.name === "AbortError" ? 504 : 502).json({ error: "Unable to reach the AI provider. Please try again later." });
  } finally { clearTimeout(timeout); }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));

app.use((req, res) => {
  if (path.extname(req.path)) return res.status(404).type("text/plain").send("Not found");
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error && error.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (error && (error.type === "entity.parse.failed" || error instanceof SyntaxError)) return res.status(400).json({ error: "Malformed JSON request body." });
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`NEXO AI listening on port ${PORT}`));
}

module.exports = app;
