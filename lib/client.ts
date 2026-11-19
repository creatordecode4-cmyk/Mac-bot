// Browser-side helpers: chat & bot storage, typewriter, voice (any language), images and friendly errors.

import { useEffect, useEffectEvent, useState } from "react";
import type { Mode } from "./ai";
import { withoutAppLinks } from "./apps";
import { toBot, type Bot } from "./bots";

export type { Mode };
export type Msg = { id: string; role: "user" | "assistant"; content: string; image?: string; error?: string };
export type Chat = { id: string; title: string; messages: Msg[]; updatedAt: number; botId?: string }; // no botId = MAC Bot

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- storage (localStorage only — nothing leaves the device except the chat request) ---------- */
const CHATS = "macbot.chats";

export const store = {
  get: (key: string, session = false) => {
    try {
      return (session ? sessionStorage : localStorage).getItem(`macbot.${key}`);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string, session = false) => {
    try {
      (session ? sessionStorage : localStorage).setItem(`macbot.${key}`, value);
    } catch {}
  },
};

export function loadChats(): Chat[] {
  try {
    return JSON.parse(localStorage.getItem(CHATS) ?? "[]");
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]) {
  try {
    localStorage.setItem(CHATS, JSON.stringify(chats));
  } catch {
    // Storage full: keep every message, drop the attached images.
    try {
      localStorage.setItem(CHATS, JSON.stringify(chats.map((c) => ({ ...c, messages: c.messages.map(({ image: _, ...m }) => m) }))));
    } catch {}
  }
}

export function loadBots(): Bot[] {
  try {
    const saved: unknown[] = JSON.parse(store.get("bots") ?? "[]");
    return saved.map((b) => toBot(b, true)).filter((b): b is Bot => !!b?.id);
  } catch {
    return [];
  }
}
export const saveBots = (bots: Bot[]) => store.set("bots", JSON.stringify(bots));

/** Let the phone's back gesture close a full-screen sheet (depth 1 = Bots, 2 = bot editor) instead of leaving the app. */
export function useBackClose(depth: number, open: boolean, close: () => void) {
  const onClose = useEffectEvent(close);
  useEffect(() => {
    if (!open) return;
    history.pushState({ sheet: depth }, "");
    const onPop = (e: PopStateEvent) => (e.state?.sheet ?? 0) < depth && onClose();
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, [depth, open]);
}

/** What we send to /api/chat: the last 20 messages (skipping failed turns); images only on the most recent ones. */
const answered = (m?: Msg) => !!m && !!(m.content || m.image);
export const toApi = (msgs: Msg[]) =>
  msgs
    .filter((m, i) => answered(m) && !(m.role === "user" && msgs[i + 1] && !answered(msgs[i + 1])))
    .slice(-20)
    .map(({ role, content, image }, i, all) => ({ role, content, ...(image && i >= all.length - 6 && { image }) }));

/* ---------- typewriter: reveal streamed text smoothly at 60fps ---------- */
export function useTypewriter(text: string, animate: boolean) {
  const [n, setN] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (n >= text.length) return;
    const id = requestAnimationFrame(() => setN((v) => Math.min(text.length, v + Math.max(2, Math.ceil((text.length - v) / 8)))));
    return () => cancelAnimationFrame(id);
  }, [n, text]);
  return text.slice(0, n);
}

/* ---------- images: shrink before upload so requests stay small ---------- */
export async function resizeImage(file: File, max = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/* ---------- voice: listen and read aloud in the chosen language ---------- */
// The reply language from the 🌐 picker ("auto" = match the user).
export const getLang = () => store.get("lang") || "auto";

// For "Auto", guess the language of a non-Latin script (Japanese kana before Chinese characters).
const SCRIPTS: [RegExp, string][] = [
  [/[\u3040-\u30ff]/, "ja"], [/[\uac00-\ud7af]/, "ko"], [/[\u4e00-\u9fff]/, "zh"], [/[\u0600-\u06ff]/, "ar"], [/[\u0590-\u05ff]/, "he"],
  [/[\u0900-\u097f]/, "hi"], [/[\u0980-\u09ff]/, "bn"], [/[\u0a00-\u0a7f]/, "pa"], [/[\u0a80-\u0aff]/, "gu"], [/[\u0b80-\u0bff]/, "ta"],
  [/[\u0c00-\u0c7f]/, "te"], [/[\u0c80-\u0cff]/, "kn"], [/[\u0d00-\u0d7f]/, "ml"], [/[\u0e00-\u0e7f]/, "th"], [/[\u0400-\u04ff]/, "ru"],
  [/[\u0370-\u03ff]/, "el"], [/[\u10a0-\u10ff]/, "ka"], [/[\u0530-\u058f]/, "hy"], [/[\u1200-\u137f]/, "am"],
];
const NON_LATIN = /^(ar|fa|ur|ps|sd|ug|he|yi|hi|mr|ne|bn|pa|gu|ta|te|kn|ml|si|th|lo|km|my|ja|ko|zh|yue|ru|uk|bg|sr|mk|be|kk|ky|mn|tg|tt|el|ka|hy|am|ti)\b/i;
function readLang(text: string) {
  if (getLang() !== "auto") return getLang();
  const script = SCRIPTS.find(([re]) => re.test(text))?.[1];
  if (script) return script;
  return NON_LATIN.test(navigator.language) ? "en-US" : navigator.language; // Latin text: the device language, unless that isn't Latin
}

export function speak(markdown: string, onDone: () => void) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const text = withoutAppLinks(markdown)
    .replace(/```[\s\S]*?```/g, " (code) ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>`|~-]+/g, " ")
    .replace(/\p{Extended_Pictographic}/gu, "");
  const lang = readLang(text);
  const base = lang.split("-")[0].toLowerCase();
  const tag = (v: SpeechSynthesisVoice) => v.lang.replace("_", "-").toLowerCase();
  const voices = synth.getVoices();
  const voice = voices.find((v) => tag(v) === lang.toLowerCase()) ?? voices.find((v) => tag(v) === base || tag(v).startsWith(`${base}-`));
  // Chrome stops long utterances, so speak sentence-sized chunks back to back.
  const parts = text.match(/[^.!?।。！？؟\n]+[.!?।。！？؟]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (!parts.length) return onDone();
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = voice?.lang ?? lang;
    if (voice) u.voice = voice;
    if (i === parts.length - 1) u.onend = onDone;
    u.onerror = onDone;
    synth.speak(u);
  });
}

/* ---------- friendly errors ---------- */
export const ERRORS: Record<string, string> = {
  rate_limit: "Whoa, that's a lot of brainpower in one minute 😮‍💨 The free AI limit was hit. Give it a minute and try again.",
  no_key: "My brain isn't plugged in yet 🔌 Add a free API key to `.env.local` (see the README) and restart the app.",
  bad_key: "Hmm, that API key isn't working 🔑 Double-check it in `.env.local` (no extra spaces!).",
  bad_model: "That AI model isn't available anymore 🤖 Update the `*_MODEL` setting in `.env.local`.",
  too_big: "That image is a bit too big for me 🐘 Try a smaller one?",
  busy: "The AI servers are a little crowded right now 🚦 Give it a few seconds and try again.",
  network: "Oops, my connection glitched mid-thought 📡 Try again?",
  offline: "Looks like you're offline 📴 Reconnect and try again.",
  empty: "I drew a blank there 🤔 Try asking again, maybe with a bit more detail?",
  stopped: "Stopped. ✋",
  error: "Oops, my circuits got tangled 🤖💫 Try again?",
};
