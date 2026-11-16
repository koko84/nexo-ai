const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { cleanMessages, MODES, LANGS, LIMITS, isValidLang, buildSystemPrompt } = require("../server/validation");
const I18N = require("../public/i18n.js");

const read = rel => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
const msg = (role, content) => ({ role, content });

test("package metadata identifies NEXO AI and has validation scripts", () => {
  const pkg = require("../package.json");
  assert.equal(pkg.name, "nexo-ai");
  assert.ok(pkg.scripts.check);
  assert.ok(pkg.scripts.test);
});

test("frontend contains the core interface and sends mode and language", () => {
  const html = read("public/index.html");
  const js = read("public/app.js");
  for (const id of ["chatForm", "prompt", "conversation", "newChat", "language", "status"]) {
    assert.ok(html.includes(`id="${id}"`), `missing ${id}`);
  }
  assert.match(js, /messages:\s*buildPayload\(\),\s*mode,\s*lang/);
  assert.ok(html.includes('src="/i18n.js"'));
  assert.ok(!/Advertisement space/.test(html), "placeholder ad area should not ship");
});

test("all visible assistant modes have server-side prompts", () => {
  for (const mode of ["chat", "learn", "write", "code", "translate", "files"]) {
    assert.equal(typeof MODES[mode], "string");
    assert.ok(MODES[mode].length > 20);
  }
});

test("message validation rejects malformed, oversized, and assistant-ending histories", () => {
  assert.deepEqual(cleanMessages([msg("user", " hello ")]), [msg("user", "hello")]);
  assert.equal(cleanMessages([]), null);
  assert.equal(cleanMessages([msg("system", "bad")]), null);
  assert.equal(cleanMessages([msg("user", "   ")]), null);
  assert.equal(cleanMessages([msg("user", "x".repeat(LIMITS.maxUserChars + 1))]), null);
  assert.equal(cleanMessages([msg("user", "hi"), msg("assistant", "hello")]), null);
  assert.equal(cleanMessages(Array.from({ length: 21 }, () => msg("user", "x"))), null);
});

test("long assistant replies and long conversations are accepted within limits", () => {
  // Regression: assistant replies used to be capped at 6000 chars, so a long reply broke the next request.
  assert.ok(cleanMessages([msg("user", "hi"), msg("assistant", "y".repeat(8000)), msg("user", "more")]));
  assert.equal(cleanMessages([msg("user", "hi"), msg("assistant", "y".repeat(LIMITS.maxAssistantChars + 1)), msg("user", "more")]), null);
  // 13 messages of 4000 chars = 52,000 chars: valid (it used to exceed the 32kb body limit).
  const ok = Array.from({ length: 13 }, (_, i) => msg(i % 2 === 0 ? "user" : "assistant", "z".repeat(4000)));
  assert.equal(cleanMessages(ok).length, 13);
  // Total history above the cap is rejected.
  const tooMuch = Array.from({ length: 15 }, (_, i) => msg(i % 2 === 0 ? "user" : "assistant", "z".repeat(5000)));
  assert.equal(cleanMessages(tooMuch), null);
});

test("interface language validation and system prompt hint", () => {
  assert.ok(isValidLang("ar"));
  assert.ok(!isValidLang("xx"));
  assert.ok(!isValidLang(undefined));
  assert.ok(!isValidLang("__proto__"));
  assert.ok(buildSystemPrompt("chat", "ar").includes(LANGS.ar));
  assert.equal(buildSystemPrompt("translate", "ar"), MODES.translate);
  assert.equal(buildSystemPrompt("chat", "bogus"), MODES.chat);
});

test("every interface language has exactly the same translation keys as English", () => {
  const base = Object.keys(I18N.en).sort();
  for (const lang of Object.keys(LANGS)) {
    assert.ok(I18N[lang], `missing dictionary for ${lang}`);
    assert.deepEqual(Object.keys(I18N[lang]).sort(), base, `key mismatch in ${lang}`);
    for (const value of Object.values(I18N[lang])) assert.ok(value.trim().length > 0);
  }
});

test("every data-i18n key used in the HTML exists in the dictionary", () => {
  const html = read("public/index.html");
  const keys = [...html.matchAll(/data-i18n(?:-prompt)?="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 20);
  for (const key of keys) assert.ok(key in I18N.en, `unknown i18n key: ${key}`);
});

test("server includes correct malformed JSON and oversized request handling", () => {
  const server = read("server/index.js");
  assert.match(server, /entity\.parse\.failed/);
  assert.match(server, /entity\.too\.large/);
  assert.match(server, /app\.use\("\/api"/);
  assert.match(server, /module\.exports/);
  assert.doesNotMatch(server, /unsafe-inline/);
});

test("legal and contact pages are completed with the real contact address and no template text", () => {
  for (const page of ["privacy", "terms", "contact", "about"]) {
    const html = read(`public/${page}.html`);
    assert.ok(html.includes("nexo859@gmail.com"), `${page} is missing the contact email`);
    assert.ok(!/Pre-publication template|Add a monitored|Add the legal/i.test(html), `${page} still has template text`);
  }
});
