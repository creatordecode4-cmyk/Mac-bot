// Server-only: which AI answers, and the rules every bot follows.
// Every provider speaks the OpenAI-compatible chat API, so switching is just config.

import { findLanguage } from "./languages";

export type Mode = "fast" | "think" | "mentor";
export type ApiMessage = { role: "user" | "assistant"; content: string; image?: string };

const PRESETS = {
  gemini: { label: "Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-flash-latest", vision: true },
  groq: { label: "Groq", url: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b", vision: false },
  openrouter: { label: "OpenRouter", url: "https://openrouter.ai/api/v1", model: "google/gemma-4-31b-it:free", vision: true }, // change with OPENROUTER_MODEL
  custom: { label: "Custom", url: "", model: "", vision: false }, // Ollama, LM Studio, any OpenAI-compatible server
};
type Name = keyof typeof PRESETS;

const env = (name: Name, key: string) => process.env[`${name.toUpperCase()}_${key}`]?.trim() || undefined;

/** Providers to try, in order. AI_PROVIDER is one name or a fallback list like "gemini,groq". */
export function providers() {
  const wanted = (process.env.AI_PROVIDER ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((n): n is Name => n in PRESETS);
  const detected = (Object.keys(PRESETS) as Name[]).filter((n) => env(n, "API_KEY") || (n === "custom" && env(n, "BASE_URL")));
  const names = wanted.length ? wanted : detected.length ? detected : (["gemini"] as Name[]);
  return names.map((name) => {
    const preset = PRESETS[name];
    const vision = env(name, "VISION");
    return {
      name,
      label: preset.label,
      url: env(name, "BASE_URL") ?? preset.url,
      key: env(name, "API_KEY"),
      model: env(name, "MODEL") ?? preset.model,
      vision: vision ? vision === "true" : preset.vision,
    };
  });
}
export type Provider = ReturnType<typeof providers>[number];

// Every bot's own personality (lib/bots.ts) sits on top of these answer rules.
const RULES = `Answer rules (always follow them, whatever your personality):
1. Answer the question in your first sentence. No intro, no greeting, and don't repeat the question.
2. Then explain in simple steps or short bullets, with one concrete example.
3. Be specific: real numbers, names, prices and steps instead of general advice. No vague or motivational filler.
4. If the question is unclear or missing a key detail, ask exactly ONE short clarifying question instead of answering, and nothing else.
5. End with one clear next step the user can take.
6. If you're not sure, say so plainly instead of guessing. Never invent facts, numbers, links or quotes. You have no internet or live data, so say so for news, prices or anything recent.
Format with Markdown: **bold** key terms, numbered steps, a table only for comparisons, code in fenced blocks with a language tag. Flag real risks (money, health, legal, safety) in one line.`;

// "Access" to other apps: the bot writes an action link, the app turns it into a button that opens the real app (components/Markdown.tsx → lib/apps.ts).
const APPS = `Apps: you can open the user's apps with an action link. Use one only when the user asks you to message, email, text, call, schedule, find a place, get directions, watch, listen, post, search or translate something. Write the content first, then put ONE link on its own line:
[Short label](app:NAME?key=value&key=value)
Apps and keys: whatsapp (text, phone) · telegram (text) · email (to, subject, body) · sms (to, body) · call (to) · calendar (title, start, end, details, location; times as YYYYMMDDTHHMM in the user's local time) · maps (q) · directions (to) · youtube (q) · spotify (q) · google (q) · x (text) · linkedin (text) · translate (text, to = a language code like es).
Leave out what you don't know instead of asking: with no phone or email the user picks the contact or group in the app, and "near me" in a maps search uses their location. URL-encode every value (space %20, new line %0A, & %26, ( %28, ) %29). Phone numbers with country code. Use only these apps and keys. You can't read the user's apps, and nothing happens until they tap the link, so never say a message was sent or an event was saved.`;

/** Low temperature = focused, factual answers. (The bot creator's "Make it with AI" drafts use 0.7.) */
export const TEMPERATURE = 0.4;

export const MODES: Record<Mode, string> = {
  fast: "Mode: FAST ⚡ — keep it tight: the answer, 2–4 short bullets, then the next step.",
  think:
    "Mode: THINK DEEPER 🧠 — think it through carefully, then reply in exactly this structure:\n**Summary:** 1–2 sentences that directly answer.\n**Steps:** numbered steps with the reasoning, real numbers and one example; note any assumption.\n**Recommendation:** one clear final recommendation and the next step.",
  mentor:
    'Mode: BUSINESS MENTOR 💼 — think like a sharp startup mentor with a first-principles founder mindset: question assumptions, think 10x not 10%, and focus on the customer\'s real problem. Make it practical for the user\'s country and currency (use their locale; if it matters and you can\'t tell, ask) and use simple numbers (costs, pricing, unit economics). End with one "Do this today" action.',
};

export const isMode = (m: unknown): m is Mode => typeof m === "string" && m in MODES;

const valid = <T,>(fn: () => T) => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

/** The selected bot's personality + shared rules + reply language + apps + the user's local time + the mode. */
export function systemPrompt(bot: { name: string; prompt: string }, mode: Mode, user: { lang?: string; locale?: string; tz?: string } = {}) {
  const tz = (user.tz && valid(() => Intl.DateTimeFormat("en-US", { timeZone: user.tz }).resolvedOptions().timeZone)) || "UTC";
  const locale = user.locale && valid(() => Intl.getCanonicalLocales(user.locale)[0]);
  const now = new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: tz });
  const lang = findLanguage(user.lang);
  const language = lang
    ? `Language: always reply in ${lang[1]} (${lang[2]}), whatever language the user writes in, unless they ask you to switch.`
    : "Language: reply in the language and script of the user's latest message. If they mix languages, mix them the same way.";
  const where = `It's ${now} for the user (time zone ${tz}${locale ? `, device language ${locale}` : ""}). Use their local currency, units and examples when it helps.`;
  return `You are ${bot.name}. ${bot.prompt}\n\n${RULES}\n${language}\n\n${APPS}\n\n${where}\n\n${MODES[mode]}`;
}

/** "Make it with AI" in the bot creator: one-line idea → bot instructions. */
export const DRAFT_PROMPT = `You design AI chat bots for MAC Bot, a premium AI assistant used all over the world. From the user's one-line idea, write the bot's instructions (its system prompt) in English, 70–140 words. Cover who the bot is and its personality, what it helps with, how it talks (tone, length, format), and 2–3 habits that make it great (for example: gives a real-world example, ends with a question). Start directly with the description, e.g. "A patient chess coach who…". Plain text only: no title, headings, lists, quotes or preamble.`;

export function buildRequest(p: Provider, system: string, temperature: number, history: ApiMessage[]) {
  const messages = history.map(({ role, content, image }) => {
    const text = content || "What's in this image?";
    if (!image || role !== "user") return { role, content: text };
    if (!p.vision) return { role, content: `${text}\n\n[The user attached an image, but this AI model can't see images. Say so briefly.]` };
    return { role, content: [{ type: "text", text }, { type: "image_url", image_url: { url: image } }] };
  });
  return {
    model: p.model,
    stream: true,
    temperature,
    messages: [{ role: "system", content: system }, ...messages],
  };
}
