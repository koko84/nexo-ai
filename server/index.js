require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const { MODES, cleanMessages, isValidLang, buildSystemPrompt } = require("./validation");

app.disable("x-powered-by");

// FIX: Vercel is always behind a proxy, so trust it by default
const trustProxyHops = Number(process.env.TRUST_PROXY || 1);
if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) app.set("trust proxy", trustProxyHops);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null
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
  if (!messages) {
    return res.status(400).json({ error: "Invalid message history. Send 1-20 valid messages, ending with a user message." });
  }
  if (typeof mode !== "string" || !Object.hasOwn(MODES, mode)) {
    return res.status(400).json({ error: "Choose a valid assistant mode." });
  }
  if (!isValidLang(lang)) {
    return res.status(400).json({ error: "Choose a supported interface language." });
  }

  // FIX: Accept GEMINI_API_KEY as fallback, so old keys work too
  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const model = process.env.AI_MODEL || "gemini-2.0-flash";
  if (!apiKey || !model) {
    return res.status(503).json({
      code: "AI_NOT_CONFIGURED",
      error: "NEXO AI is not connected to a live AI provider yet. The site owner must configure AI_API_KEY and AI_MODEL on the server."
    });
  }

  // FIX: Default to Gemini OpenAI-compatible endpoint
  const endpoint = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  let parsedTimeout = Number(process.env.AI_TIMEOUT_MS || 45000);
  if (!Number.isFinite(parsedTimeout)) parsedTimeout = 45000;
  const timeoutMs = Math.min(120000, Math.max(5000, parsedTimeout));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: buildSystemPrompt(mode, lang) }, ...messages],
        temperature: 0.7,
        max_tokens: Math.min(2000, Math.max(128, Number(process.env.AI_MAX_TOKENS) || 1200))
      })
    });
    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.error("AI provider error status:", upstream.status, JSON.stringify(data));
      return res.status(502).json({ error: "The AI provider could not complete this request. Check provider configuration, billing and limits." });
    }
    const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({ error: "The AI provider returned an unsupported response format." });
    }
    res.set("Cache-Control", "no-store");
    return res.json({ reply: reply.trim() });
  } catch (error) {
    const timedOut = error && error.name === "AbortError";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? "The AI provider took too long to respond. Please try again." : "Unable to reach the AI provider. Please try again later."
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));

// FIX: Use app.use instead of app.get("*") - works on Express 4 and Express 5
app.use((req, res) => {
  if (path.extname(req.path)) return res.status(404).type("text/plain").send("Not found");
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error && error.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (error && (error.type === "entity.parse.failed" || error instanceof SyntaxError)) {
    return res.status(400).json({ error: "Malformed JSON request body." });
  }
  console.error("Application error:", error && error.message ? error.message : "unknown");
  return res.status(500).json({ error: "An unexpected server error occurred." });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`NEXO AI listening on port ${PORT}`));
}

// FIX: Vercel needs app directly, not { app }
module.exports = app;
