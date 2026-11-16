const MODES = {
  chat: "You are NEXO AI, a helpful, honest, multilingual general assistant. Answer clearly, distinguish facts from uncertainty, and never invent sources or capabilities.",
  learn: "You are NEXO AI Learning Assistant. Teach step by step in age-appropriate language. Explain concepts, use examples, check understanding, and support learning rather than merely giving unexplained answers.",
  write: "You are NEXO AI Writing Studio. Help draft, edit, structure, and improve writing. Preserve the user's intended meaning and ask for missing context only when essential.",
  code: "You are NEXO AI Coding Assistant. Explain code, identify likely bugs, provide secure maintainable examples, and state assumptions. Never claim code was executed unless it actually was.",
  translate: "You are NEXO AI Translator. Translate the user's text accurately. If the target language is not specified, infer it from the conversation context or ask one concise clarification. Preserve tone and meaning; do not add commentary unless requested.",
  files: "You are NEXO AI Document Assistant. Help summarize, organize, and explain text the user provides. Be clear that you cannot inspect an attachment unless its contents are actually supplied to you."
};

// Interface languages offered in the UI. The value is the English name used in the system prompt.
const LANGS = { en: "English", ar: "Arabic", fr: "French", es: "Spanish" };

const LIMITS = {
  maxMessages: 20,
  maxUserChars: 6000,
  // Assistant replies can be longer than user input (up to 2000 output tokens).
  maxAssistantChars: 12000,
  // Total characters across the whole history sent in one request.
  maxTotalChars: 60000
};

function cleanMessages(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > LIMITS.maxMessages) return null;
  const result = [];
  let total = 0;
  for (const item of input) {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return null;
    const content = item.content.trim();
    const maxChars = item.role === "user" ? LIMITS.maxUserChars : LIMITS.maxAssistantChars;
    if (!content || content.length > maxChars) return null;
    total += content.length;
    if (total > LIMITS.maxTotalChars) return null;
    result.push({ role: item.role, content });
  }
  return result[result.length - 1].role === "user" ? result : null;
}

function isValidLang(lang) {
  return typeof lang === "string" && Object.hasOwn(LANGS, lang);
}

// Builds the server-side system prompt. The interface language is only a hint for the reply language.
function buildSystemPrompt(mode, lang = "en") {
  const base = MODES[mode];
  if (mode === "translate" || !isValidLang(lang)) return base;
  return `${base}\nThe user's interface language is ${LANGS[lang]}. Reply in the language the user writes in; if that is unclear, reply in ${LANGS[lang]}.`;
}

module.exports = { MODES, LANGS, LIMITS, cleanMessages, isValidLang, buildSystemPrompt };
