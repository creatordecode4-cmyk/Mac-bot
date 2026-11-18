# MAC Bot 🤖 — Your smartest little friend

![MAC Bot](app/opengraph-image.jpg)

A premium, dark, mobile-first AI chat app that runs **100% free to start**. It talks in Hinglish by default, streams answers live, listens to your voice, reads replies aloud, sees images, and has three brains: **Fast**, **Think Deeper** and **Business Mentor**.

Built with Next.js (App Router), Tailwind CSS and Framer Motion. Installable on phones as an app (PWA). Ready for Vercel's free plan.

## ✨ Features

- **Streaming replies** with a smooth typewriter effect, Markdown, tables and code blocks with syntax highlighting and a copy button
- **Memory**: the last ~20 messages go with every question
- **Bots**: MAC Bot, Business Mentor, English Coach, Coding Buddy, Study Tutor, Startup Idea Generator, Fitness Coach and Chef, each with its own look, color and chat history
- **Bot creator**: make your own bot (name, avatar, color, personality, greeting), let AI draft its instructions, then export it as a file for friends to import
- **Chat history** saved on your device (localStorage), with rename and delete
- **Voice input** in Hindi or English, plus a **read-aloud** button on every reply
- **Modes**: ⚡ Fast · 🧠 Think Deeper (step-by-step) · 💼 Business Mentor, on top of any bot
- **Hinglish by default**, and it switches to your language automatically
- **Image upload** when the AI model supports vision (Gemini does)
- **Friendly errors**: hit the free rate limit and MAC Bot asks for a chai break instead of crashing
- **Living mascot**: blinks, glances around, looks down while you type, spins while it thinks and smiles with a bounce when a reply arrives (calmer with "reduce motion" on)
- **Installable app** (manifest + service worker), works on a 380px phone first

## 🚀 Quick start (about 5 minutes)

You need [Node.js](https://nodejs.org) 20.9 or newer.

### 1. Get a free API key

Default AI: **Google Gemini** (free tier, no credit card).

1. Open [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with Google.
2. Click **Create API key** and copy it.

> Tip: use a key from a project **without billing** turned on. Then the worst that can happen is a friendly "rate limit" message — never a surprise bill.

### 2. Add it to `.env.local`

```bash
cp .env.example .env.local
```

Open `.env.local` and paste your key:

```bash
AI_PROVIDER=gemini
GEMINI_API_KEY=paste-your-key-here
```

Your key stays on the server. It is never sent to the browser.

### 3. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, and [http://localhost:3000/chat](http://localhost:3000/chat) to chat.

**Try it on your phone:** connect to the same Wi‑Fi and open `http://YOUR-COMPUTER-IP:3000` (the terminal prints it as "Network"). Voice input, copy buttons and "Install app" need HTTPS, so test those on your Vercel link (below).

## 🔁 Switch AI provider (one env variable)

Every provider uses the same OpenAI-compatible API, so switching is just config. Change `AI_PROVIDER` and add that provider's key:

| `AI_PROVIDER` | Free key | Default model | Images |
| --- | --- | --- | --- |
| `gemini` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → `GEMINI_API_KEY` | `gemini-flash-latest` | ✅ |
| `groq` | [console.groq.com/keys](https://console.groq.com/keys) → `GROQ_API_KEY` | `openai/gpt-oss-120b` | ❌ |
| `openrouter` | [openrouter.ai/keys](https://openrouter.ai/keys) → `OPENROUTER_API_KEY` | `openrouter/free` (auto-picks a free model) | ✅ |
| `custom` | any OpenAI-compatible server (Ollama, LM Studio…) → `CUSTOM_BASE_URL` | `CUSTOM_MODEL` | `CUSTOM_VISION=true` |

- **Auto-fallback:** set `AI_PROVIDER=gemini,groq` with both keys. If Gemini is rate-limited or down, MAC Bot quietly answers with Groq.
- **Change a model:** set `GEMINI_MODEL`, `GROQ_MODEL` or `OPENROUTER_MODEL` (for example `GEMINI_MODEL=gemini-flash-lite-latest`, which usually has higher free limits).
- Leave `AI_PROVIDER` empty and MAC Bot uses the first provider that has a key.

Restart `npm run dev` after editing `.env.local`. On Vercel, redeploy after changing variables.

## ☁️ Deploy to Vercel (free)

1. Push this project to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub and **Import** the repo. Vercel detects Next.js automatically.
3. Open **Environment Variables** and add the same values as your `.env.local` (`AI_PROVIDER`, `GEMINI_API_KEY`, …).
4. Click **Deploy**. In about a minute you get a live `https://your-app.vercel.app` link.

Prefer the terminal?

```bash
npx vercel                        # first deploy (answer the prompts)
npx vercel env add GEMINI_API_KEY # paste your key, pick all environments
npx vercel --prod                 # deploy again with the key
```

## 📱 Install it on your phone

Open your Vercel link on your phone:

- **Android (Chrome):** tap the **Install** button on the landing page, or ⋮ → **Install app**.
- **iPhone (Safari):** tap **Share** → **Add to Home Screen**.

It opens full-screen with the MAC Bot icon, like a real app.

## 🤖 Bots

Tap **Bots** in the chat header (or in the menu) to switch bots. Every bot keeps its own chat history, and the Fast / Think Deeper / Mentor switch works with all of them.

**Create your own:** Bots → **Create your own bot**. Give it a name, a one-line description, an emoji (or the mascot in your color) and a personality. Tap **✨ Make it with AI** to have it write the instructions from your one-line description, check the live preview, then save.

**Share a bot:** tap the ⬇ icon on your bot to download it as a `.json` file. A friend opens Bots → **Import**, picks the file, previews it and saves. Custom bots live in the browser only: no database, no login.

## 🎨 Make it yours

| What | Where |
| --- | --- |
| Built-in bots (names, colors, personalities, starter chips) | `lib/bots.ts` |
| Shared rules (honesty, language), the three modes | `lib/ai.ts` |
| Providers and default models | `lib/ai.ts` (`PRESETS`) |
| Friendly error messages | `lib/client.ts` (`ERRORS`) |
| Colors, glass effect, animations | `app/globals.css` |
| Landing page copy | `app/page.tsx` |

The mascot: `public/bot.png` is the original art. `public/mascot-body.webp` plus the two `mascot-eye-*.webp` layers are cut from it, so the eyes can blink and look around. `mascot.webp` is the small avatar. The app icons and share image are made from it too.

## 🗂️ Project structure

```
app/
  page.tsx            Landing page (hero, features, live demo, footer)
  chat/page.tsx       The chat app
  api/chat/route.ts   Streams replies from the AI provider
  layout.tsx          Fonts, metadata, aurora background
  manifest.ts         PWA manifest
components/           Chat, Composer, Sidebar, Message, Markdown, Mascot, Bots, BotEditor, DemoChat, Pwa
lib/ai.ts             Providers + shared rules and modes (server only)
lib/bots.ts           Built-in bots + bot file import/export
lib/client.ts         Chat & bot storage, typewriter, voice, images, friendly errors (browser)
public/sw.js          Service worker (offline app shell)
```

## 🛟 Troubleshooting

- **"Mera dimaag abhi plug-in nahi hua 🔌"**: there's no API key. Check `.env.local`, then restart `npm run dev`.
- **"chai break ☕"**: you hit the provider's free limit. Wait a minute, or add a fallback (`AI_PROVIDER=gemini,groq`). Free limits change often: see [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [Groq rate limits](https://console.groq.com/docs/rate-limits).
- **"That AI model isn't available anymore"**: providers retire models. Set a current model with `GEMINI_MODEL` / `GROQ_MODEL` / `OPENROUTER_MODEL`.
- **No mic button**: your browser doesn't support speech recognition (Firefox doesn't). Use Chrome, Edge or Safari over HTTPS.
- **No image button**: the current model can't see images. Use Gemini or OpenRouter.
- **Chats disappeared**: history lives in this browser only. Clearing site data or using another browser starts fresh.

---

Made with 💜 in India.
