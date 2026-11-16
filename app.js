(() => {
  "use strict";
  const I18N = window.NEXO_I18N;
  const form = document.getElementById("chatForm");
  const input = document.getElementById("prompt");
  const conversation = document.getElementById("conversation");
  const welcome = document.getElementById("welcome");
  const sendButton = document.getElementById("sendBtn");
  const statusLine = document.getElementById("status");
  const languageSelect = document.getElementById("language");

  // Must stay within the server limits in server/validation.js.
  const MAX_MESSAGES = 20;
  const MAX_TOTAL_CHARS = 60000;
  const MAX_REPLY_CHARS = 12000;

  const history = [];
  let mode = "chat";
  let lang = "en";

  const t = key => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;

  function setStatus(message) {
    statusLine.textContent = message || "";
    statusLine.hidden = !message;
  }

  function updateModeUi() {
    document.getElementById("modeTitle").textContent = t(`nav_${mode}`);
    input.placeholder = mode === "translate" ? t("placeholderTranslate") : t("placeholder").replace("{mode}", t(`nav_${mode}`));
  }

  function applyLanguage(next) {
    lang = Object.hasOwn(I18N, next) ? next : "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-prompt]").forEach(el => { el.dataset.prompt = t(el.dataset.i18nPrompt); });
    languageSelect.value = lang;
    updateModeUi();
    try { localStorage.setItem("nexo-lang", lang); } catch (_) { /* storage may be unavailable */ }
  }

  function addMessage(role, text) {
    const row = document.createElement("div");
    row.className = `message ${role}`;
    const who = document.createElement("div");
    who.className = "who";
    if (role === "user") who.dataset.i18n = "you";
    who.textContent = role === "user" ? t("you") : "N";
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.dir = "auto";
    bubble.textContent = text;
    row.append(who, bubble);
    conversation.append(row);
    welcome.hidden = true;
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return { row, bubble };
  }

  // Newest messages first, capped by count and total characters so requests never exceed server limits.
  function buildPayload() {
    const out = [];
    let total = 0;
    for (let i = history.length - 1; i >= 0 && out.length < MAX_MESSAGES; i--) {
      const size = history[i].content.length;
      if (out.length && total + size > MAX_TOTAL_CHARS) break;
      total += size;
      out.unshift(history[i]);
    }
    return out;
  }

  async function sendMessage(text) {
    const value = (text ?? input.value).trim();
    if (!value || sendButton.disabled) return;
    setStatus("");
    input.value = "";
    const userMsg = addMessage("user", value);
    history.push({ role: "user", content: value });
    const pending = addMessage("assistant", t("connecting"));
    sendButton.disabled = true;
    input.disabled = true;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: buildPayload(), mode, lang })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The request failed.");
      if (typeof data.reply !== "string" || !data.reply) throw new Error("No response was returned.");
      pending.bubble.textContent = data.reply;
      history.push({ role: "assistant", content: data.reply.slice(0, MAX_REPLY_CHARS) });
    } catch (error) {
      // Roll back the failed turn completely and give the text back, so retrying does not duplicate it.
      history.pop();
      userMsg.row.remove();
      pending.row.remove();
      if (!conversation.children.length) welcome.hidden = false;
      input.value = value;
      setStatus(error instanceof TypeError || !error.message ? t("failed") : error.message);
    } finally {
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage();
  });
  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      sendMessage();
    }
  });
  document.querySelectorAll(".prompt-card").forEach(button => {
    button.addEventListener("click", () => sendMessage(button.dataset.prompt));
  });
  document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      mode = button.dataset.mode;
      updateModeUi();
      input.focus();
    });
  });
  document.getElementById("newChat").addEventListener("click", () => {
    history.length = 0;
    conversation.replaceChildren();
    welcome.hidden = false;
    input.value = "";
    setStatus("");
    input.focus();
  });
  languageSelect.addEventListener("change", event => applyLanguage(event.target.value));

  let initial = "en";
  try { initial = localStorage.getItem("nexo-lang") || ""; } catch (_) { initial = ""; }
  if (!Object.hasOwn(I18N, initial)) {
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    initial = Object.hasOwn(I18N, browser) ? browser : "en";
  }
  applyLanguage(initial);
})();
