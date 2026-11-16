(function (root) {
  "use strict";
  const I18N = {
    en: {
      newChat: "＋ New conversation", workspace: "WORKSPACE",
      nav_chat: "AI Chat", nav_learn: "Learning assistant", nav_write: "Writing studio",
      nav_code: "Coding assistant", nav_translate: "Translator", nav_files: "Document tools",
      sideNote: "AI can make mistakes. Verify important information.",
      eyebrow: "YOUR AI WORKSPACE", h1a: "What can we", h1b: "create", h1c: "today?",
      subtitle: "Ask questions, explore ideas, learn something new, or plan your next project.",
      c1t: "Learn something", c1s: "Clear explanations, step by step", c1p: "Explain a difficult topic in simple steps.",
      c2t: "Explore ideas", c2s: "Brainstorm and plan your next idea", c2p: "Help me brainstorm an original project idea.",
      c3t: "Write better", c3s: "Draft, improve and summarize text", c3p: "Help me write a clear and professional message.",
      c4t: "Build with code", c4s: "Understand code and solve errors", c4p: "Help me understand and debug this code.",
      hint: "Never share passwords or sensitive personal information.",
      disclaimer: "NEXO AI responses may be inaccurate. Check important information independently.",
      placeholder: "Message NEXO AI — {mode}…", placeholderTranslate: "Enter text and target language…",
      connecting: "Connecting…", failed: "Unable to send your message. Please try again.", you: "You"
    },
    ar: {
      newChat: "＋ محادثة جديدة", workspace: "مساحة العمل",
      nav_chat: "دردشة الذكاء الاصطناعي", nav_learn: "مساعد التعلّم", nav_write: "استوديو الكتابة",
      nav_code: "مساعد البرمجة", nav_translate: "المترجم", nav_files: "أدوات المستندات",
      sideNote: "قد يخطئ الذكاء الاصطناعي. تحقق من المعلومات المهمة.",
      eyebrow: "مساحة عملك مع الذكاء الاصطناعي", h1a: "ماذا يمكننا أن", h1b: "ننشئ", h1c: "اليوم؟",
      subtitle: "اطرح أسئلتك، واستكشف أفكارك، وتعلّم شيئاً جديداً، أو خطّط لمشروعك القادم.",
      c1t: "تعلّم شيئاً", c1s: "شروحات واضحة خطوة بخطوة", c1p: "اشرح لي موضوعاً صعباً بخطوات بسيطة.",
      c2t: "استكشف الأفكار", c2s: "عصف ذهني وتخطيط لفكرتك القادمة", c2p: "ساعدني في توليد فكرة مشروع أصلية.",
      c3t: "اكتب بشكل أفضل", c3s: "صياغة النصوص وتحسينها وتلخيصها", c3p: "ساعدني في كتابة رسالة واضحة ومهنية.",
      c4t: "ابنِ بالبرمجة", c4s: "افهم الكود وحلّ الأخطاء", c4p: "ساعدني في فهم هذا الكود وتصحيح أخطائه.",
      hint: "لا تشارك كلمات المرور أو معلومات شخصية حساسة.",
      disclaimer: "قد تكون ردود NEXO AI غير دقيقة. تحقق من المعلومات المهمة بنفسك.",
      placeholder: "راسل NEXO AI — {mode}…", placeholderTranslate: "أدخل النص واللغة المطلوبة…",
      connecting: "جارٍ الاتصال…", failed: "تعذّر إرسال رسالتك. حاول مرة أخرى.", you: "أنت"
    },
    fr: {
      newChat: "＋ Nouvelle conversation", workspace: "ESPACE DE TRAVAIL",
      nav_chat: "Chat IA", nav_learn: "Assistant d'apprentissage", nav_write: "Studio d'écriture",
      nav_code: "Assistant de code", nav_translate: "Traducteur", nav_files: "Outils documentaires",
      sideNote: "L'IA peut se tromper. Vérifiez les informations importantes.",
      eyebrow: "VOTRE ESPACE IA", h1a: "Que pouvons-nous", h1b: "créer", h1c: "aujourd'hui ?",
      subtitle: "Posez des questions, explorez des idées, apprenez ou planifiez votre prochain projet.",
      c1t: "Apprendre", c1s: "Explications claires, étape par étape", c1p: "Explique-moi un sujet difficile en étapes simples.",
      c2t: "Explorer des idées", c2s: "Brainstorming et planification", c2p: "Aide-moi à trouver une idée de projet originale.",
      c3t: "Mieux écrire", c3s: "Rédiger, améliorer et résumer", c3p: "Aide-moi à rédiger un message clair et professionnel.",
      c4t: "Coder", c4s: "Comprendre le code et corriger les erreurs", c4p: "Aide-moi à comprendre et déboguer ce code.",
      hint: "Ne partagez jamais de mots de passe ni d'informations personnelles sensibles.",
      disclaimer: "Les réponses de NEXO AI peuvent être inexactes. Vérifiez les informations importantes.",
      placeholder: "Message à NEXO AI — {mode}…", placeholderTranslate: "Saisissez le texte et la langue cible…",
      connecting: "Connexion…", failed: "Impossible d'envoyer votre message. Réessayez.", you: "Vous"
    },
    es: {
      newChat: "＋ Nueva conversación", workspace: "ESPACIO DE TRABAJO",
      nav_chat: "Chat con IA", nav_learn: "Asistente de aprendizaje", nav_write: "Estudio de escritura",
      nav_code: "Asistente de código", nav_translate: "Traductor", nav_files: "Herramientas de documentos",
      sideNote: "La IA puede cometer errores. Verifica la información importante.",
      eyebrow: "TU ESPACIO DE IA", h1a: "¿Qué podemos", h1b: "crear", h1c: "hoy?",
      subtitle: "Haz preguntas, explora ideas, aprende algo nuevo o planifica tu próximo proyecto.",
      c1t: "Aprender algo", c1s: "Explicaciones claras, paso a paso", c1p: "Explícame un tema difícil en pasos sencillos.",
      c2t: "Explorar ideas", c2s: "Lluvia de ideas y planificación", c2p: "Ayúdame a idear un proyecto original.",
      c3t: "Escribir mejor", c3s: "Redacta, mejora y resume textos", c3p: "Ayúdame a escribir un mensaje claro y profesional.",
      c4t: "Programar", c4s: "Entiende código y resuelve errores", c4p: "Ayúdame a entender y depurar este código.",
      hint: "Nunca compartas contraseñas ni información personal sensible.",
      disclaimer: "Las respuestas de NEXO AI pueden ser inexactas. Verifica la información importante.",
      placeholder: "Mensaje a NEXO AI — {mode}…", placeholderTranslate: "Escribe el texto y el idioma de destino…",
      connecting: "Conectando…", failed: "No se pudo enviar tu mensaje. Inténtalo de nuevo.", you: "Tú"
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = I18N;
  else root.NEXO_I18N = I18N;
})(typeof window !== "undefined" ? window : globalThis);
