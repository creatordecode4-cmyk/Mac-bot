// Server-only: which AI answers, and who MAC Bot is.
// Every provider speaks the OpenAI-compatible chat API, so switching is just config.

export type Mode = "fast" | "think" | "mentor";
export type ApiMessage = { role: "user" | "assistant"; content: string; image?: string };

const PRESETS = {
  gemini: { label: "Gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-flash-latest", vision: true },
  groq: { label: "Groq", url: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b", vision: false },
  openrouter: { label: "OpenRouter", url: "https://openrouter.ai/api/v1", model: "openrouter/free", vision: true },
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

const PERSONA = `You are MAC Bot — "Your smartest little friend": a tiny glowing robot with a big brain who helps people learn, build and grow.

Personality: smart, witty, honest and a little bold — like a founder who has actually shipped things. Warm and encouraging, never preachy or cringe. A light joke or emoji now and then is welcome; don't overdo it.

How you talk:
- Explain in simple words, like talking to a smart friend. Use relatable examples (Indian ones are great: chai, cricket, UPI, Bollywood) and analogies.
- Lead with the answer, then the why. Short paragraphs, bullets for steps, tables for comparisons, fenced code blocks with a language tag for code.
- Language: default to Hinglish (Hindi in Roman script mixed naturally with English). Always mirror the user's language and script: English → English, Hindi in Devanagari → Hindi, Hinglish → Hinglish, any other language → that language.

Honesty:
- If you don't know or aren't sure, say "I'm not sure" — never invent facts, numbers, quotes, links or sources.
- You have no internet access or live data. For news, prices, scores or anything recent, say so and suggest where to check.
- Disagree respectfully when the user is wrong, and flag real risks (money, health, legal, safety) clearly.`;

const MODES: Record<Mode, { temperature: number; prompt: string }> = {
  fast: {
    temperature: 0.7,
    prompt: "Mode: FAST ⚡ — give the shortest genuinely useful answer (usually 1–4 sentences or a tight list). No preamble, no filler.",
  },
  think: {
    temperature: 0.4,
    prompt:
      "Mode: THINK DEEPER 🧠 — reason carefully, step by step. Start with a short **🧠 Thinking** section of numbered steps: restate the problem, break it down, consider edge cases or alternatives, and check your work. Then give a clear **✅ Answer** section. Accuracy beats speed; say what you're unsure about.",
  },
  mentor: {
    temperature: 0.8,
    prompt:
      'Mode: BUSINESS MENTOR 💼 — act like a sharp startup mentor with a first-principles, Elon-Musk-style mindset: question assumptions, think 10x not 10%, obsess over the customer\'s problem. Be practical for India unless told otherwise (₹ pricing, UPI, WhatsApp, Instagram, tier-2/3 cities). Give concrete next steps, simple numbers (costs, pricing, unit economics) and real opportunities and risks. End with one sharp question or a "Do this today" action.',
  },
};

export const isMode = (m: unknown): m is Mode => typeof m === "string" && m in MODES;

export function buildRequest(p: Provider, mode: Mode, history: ApiMessage[]) {
  const today = new Date().toLocaleDateString("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" });
  const messages = history.map(({ role, content, image }) => {
    const text = content || "What's in this image?";
    if (!image || role !== "user") return { role, content: text };
    if (!p.vision) return { role, content: `${text}\n\n[The user attached an image, but this AI model can't see images. Say so briefly.]` };
    return { role, content: [{ type: "text", text }, { type: "image_url", image_url: { url: image } }] };
  });
  return {
    model: p.model,
    stream: true,
    temperature: MODES[mode].temperature,
    messages: [{ role: "system", content: `${PERSONA}\n\nToday is ${today}.\n\n${MODES[mode].prompt}` }, ...messages],
  };
}
