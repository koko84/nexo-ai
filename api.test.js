// End-to-end HTTP tests against the real Express app, using a local fake AI provider.
// They need the dependencies installed (npm install); otherwise they are skipped.
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { once } = require("node:events");

let hasDeps = true;
try { ["express", "helmet", "express-rate-limit", "dotenv"].forEach(m => require.resolve(m)); } catch { hasDeps = false; }
const opts = { skip: hasDeps ? false : "dependencies not installed (run npm install)" };

let server, provider, base, lastProviderRequest;

async function start() {
  if (server) return;
  provider = http.createServer((req, res) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; });
    req.on("end", () => {
      lastProviderRequest = { headers: req.headers, body: JSON.parse(raw) };
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ choices: [{ message: { content: "  Hello from provider  " } }] }));
    });
  });
  provider.listen(0, "127.0.0.1");
  await once(provider, "listening");
  process.env.AI_API_URL = `http://127.0.0.1:${provider.address().port}/v1/chat/completions`;
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "test-model";
  const { app } = require("../server/index");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
}

test.after(() => { if (server) server.close(); if (provider) provider.close(); });

const post = (body) => fetch(`${base}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: typeof body === "string" ? body : JSON.stringify(body)
});
const user = (content) => ({ role: "user", content });

test("health endpoint reports configuration", opts, async () => {
  await start();
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).aiConfigured, true);
});

test("security headers: CSP without unsafe-inline, no x-powered-by", opts, async () => {
  await start();
  const res = await fetch(`${base}/`);
  const csp = res.headers.get("content-security-policy");
  assert.ok(csp && csp.includes("style-src 'self'") && !csp.includes("unsafe-inline"));
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("malformed JSON gets 400 and oversized body gets 413", opts, async () => {
  await start();
  assert.equal((await post("{not json")).status, 400);
  const huge = JSON.stringify({ messages: [user("x".repeat(300000))], mode: "chat" });
  assert.equal((await post(huge)).status, 413);
});

test("invalid mode and invalid language get 400", opts, async () => {
  await start();
  assert.equal((await post({ messages: [user("hi")], mode: "nope" })).status, 400);
  assert.equal((await post({ messages: [user("hi")], mode: "chat", lang: "xx" })).status, 400);
});

test("successful chat forwards key, system prompt and language hint to provider", opts, async () => {
  await start();
  const res = await post({ messages: [user("hello")], mode: "chat", lang: "ar" });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).reply, "Hello from provider");
  assert.equal(lastProviderRequest.headers.authorization, "Bearer test-key");
  assert.equal(lastProviderRequest.body.model, "test-model");
  assert.equal(lastProviderRequest.body.messages[0].role, "system");
  assert.ok(lastProviderRequest.body.messages[0].content.includes("Arabic"));
});

test("a long conversation (52,000 chars) is accepted instead of 413", opts, async () => {
  await start();
  const history = Array.from({ length: 13 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "q".repeat(4000) }));
  assert.equal((await post({ messages: history, mode: "chat", lang: "en" })).status, 200);
});

test("an 8,000-character assistant reply in history is accepted", opts, async () => {
  await start();
  const history = [user("hi"), { role: "assistant", content: "a".repeat(8000) }, user("continue")];
  assert.equal((await post({ messages: history, mode: "chat" })).status, 200);
});

test("returns 503 when the provider is not configured", opts, async () => {
  await start();
  const saved = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  try {
    const res = await post({ messages: [user("hi")], mode: "chat" });
    assert.equal(res.status, 503);
    assert.equal((await res.json()).code, "AI_NOT_CONFIGURED");
  } finally { process.env.AI_API_KEY = saved; }
});

test("routing: unknown API is JSON 404, missing file is 404, app routes serve the SPA", opts, async () => {
  await start();
  const api = await fetch(`${base}/api/nope`);
  assert.equal(api.status, 404);
  assert.ok((await api.json()).error);
  assert.equal((await fetch(`${base}/missing.js`)).status, 404);
  const spa = await fetch(`${base}/some/route`);
  assert.equal(spa.status, 200);
  assert.ok((await spa.text()).includes("NEXO"));
  assert.equal((await fetch(`${base}/privacy.html`)).status, 200);
});
