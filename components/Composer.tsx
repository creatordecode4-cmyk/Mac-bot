"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Brain, Briefcase, Globe, ImagePlus, Mic, Square, X, Zap } from "lucide-react";
import { resizeImage, type Mode } from "@/lib/client";
import { findLanguage, LANGUAGES } from "@/lib/languages";

const MODES = [
  { id: "fast", label: "Fast", title: "Fast — quick, short answers", Icon: Zap },
  { id: "think", label: "Think", title: "Think Deeper — step-by-step reasoning", Icon: Brain },
  { id: "mentor", label: "Mentor", title: "Business Mentor — startup & money advice", Icon: Briefcase },
] as const;

type Recognition = { lang: string; interimResults: boolean; start(): void; stop(): void; abort(): void; onresult: (e: any) => void; onend: () => void; onerror: (e: any) => void };
const Speech = () => {
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export default function Composer(props: {
  onSend: (text: string, image?: string) => void;
  onStop: () => void;
  onType: () => void;
  busy: boolean;
  mode: Mode;
  setMode: (m: Mode) => void;
  lang: string; // reply language: a LANGUAGES code or "auto"
  setLang: (l: string) => void;
  vision: boolean;
  placeholder: string;
}) {
  const { onSend, onStop, onType, busy, mode, setMode, lang, setLang, vision, placeholder } = props;
  const [text, setText] = useState("");
  const [image, setImage] = useState<string>();
  const [voice, setVoice] = useState(false);
  const [listening, setListening] = useState(""); // the language being listened to
  const picked = findLanguage(lang);
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const rec = useRef<Recognition | null>(null);
  const canSend = !busy && (!!text.trim() || !!image);

  useEffect(() => {
    setVoice(!!Speech());
  }, []);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [text]);

  const submit = () => {
    if (!canSend) return;
    rec.current?.stop();
    onSend(text.trim(), image);
    setText("");
    setImage(undefined);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const touch = matchMedia("(pointer: coarse)").matches; // on phones Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey && !touch && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const attach = async (f?: File | null) => {
    if (!f?.type.startsWith("image/")) return;
    try {
      setImage(await resizeImage(f));
    } catch {
      alert("Couldn't read that image — try a JPG or PNG.");
    }
  };

  const onPaste = (e: ClipboardEvent) => {
    const img = vision && Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (img) {
      e.preventDefault();
      attach(img);
    }
  };

  // Voice input in the reply language, or in the device's language on "Auto".
  const listen = (code = lang) => {
    const SR = Speech();
    if (!SR) return;
    rec.current?.abort();
    const l = findLanguage(code);
    const r = new SR();
    r.lang = l?.[0] ?? navigator.language;
    r.interimResults = true;
    const before = text.trim() ? `${text.trim()} ` : "";
    r.onresult = (e) => setText(before + Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>).map((x) => x[0].transcript).join(""));
    r.onend = () => {
      if (rec.current === r) {
        rec.current = null;
        setListening("");
      }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") alert("Microphone permission is blocked — allow it in your browser settings.");
    };
    rec.current = r;
    r.start();
    setListening(l?.[2] ?? new Intl.DisplayNames([navigator.language], { type: "language" }).of(navigator.language) ?? navigator.language);
  };

  return (
    <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
      <div className="mx-auto max-w-3xl">
        <div className="glass relative rounded-[26px] p-2 shadow-[0_18px_50px_-24px_rgb(0_0_0/.9)] transition-[border-color] duration-300 focus-within:border-white/20">
          {/* While the AI thinks and writes, an iridescent ring turns around the box. */}
          <span aria-hidden className={`ai-ring ${busy ? "on" : ""}`} />
          {listening && (
            <div className="flex items-center gap-2 px-3 pt-1.5 text-xs">
              <span className="size-2 animate-pulse rounded-full bg-pearl shadow-[0_0_8px] shadow-white/70" />
              <span className="text-pearl/90">Listening · {listening}</span>
              <span className="ml-auto hidden text-muted sm:inline">Change the language with 🌐</span>
            </div>
          )}
          {image && (
            <div className="relative ml-2 mt-2 inline-block">
              <img src={image} alt="Attachment preview" className="h-20 rounded-xl border border-white/10 object-cover" />
              <button onClick={() => setImage(undefined)} className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-pearl text-night" aria-label="Remove image">
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
          <textarea
            ref={area}
            rows={1}
            value={text}
            onChange={(e) => (setText(e.target.value), onType())}
            onKeyDown={onKey}
            onPaste={onPaste}
            placeholder={placeholder}
            dir="auto"
            aria-label="Message"
            className="block max-h-48 w-full resize-none bg-transparent px-3 py-2 text-base leading-6 outline-none placeholder:text-muted"
          />
          <div className="flex items-center gap-1">
            <div role="radiogroup" aria-label="Mode" className="flex rounded-full bg-white/[.04] p-0.5 ring-1 ring-white/[.06]">
              {MODES.map(({ id, label, title, Icon }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={mode === id}
                  aria-label={title}
                  title={title}
                  onClick={() => setMode(id)}
                  className={`relative flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold transition-colors ${mode === id ? "text-night" : "text-muted hover:text-pearl"}`}
                >
                  {mode === id && <motion.span layoutId="mode" className="bg-brand absolute inset-0 rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.45 }} />}
                  <Icon size={14} className="relative" />
                  <span className={`relative ${mode === id ? "max-[359px]:hidden" : "hidden sm:inline"}`}>{label}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <label
                title="Reply language"
                className="relative flex h-9 min-w-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted transition hover:bg-white/[.06] hover:text-pearl focus-within:text-pearl"
              >
                <Globe size={18} />
                {picked && <span className="max-[359px]:hidden sm:hidden">{picked[0].split("-")[0].toUpperCase()}</span>}
                <span className="hidden max-w-28 truncate sm:inline">{picked?.[2] ?? "Auto"}</span>
                <select
                  value={picked ? lang : "auto"}
                  onChange={(e) => (setLang(e.target.value), rec.current && listen(e.target.value))}
                  aria-label="Reply language"
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                >
                  <option value="auto">Auto · reply in my language</option>
                  {LANGUAGES.map(([code, name, native]) => (
                    <option key={code} value={code}>
                      {native === name ? name : `${native} · ${name}`}
                    </option>
                  ))}
                </select>
              </label>
              {vision && (
                <button onClick={() => file.current?.click()} className="icon-btn" aria-label="Attach an image" title="Attach image">
                  <ImagePlus size={19} />
                </button>
              )}
              {voice && (
                <button onClick={() => (listening ? rec.current?.stop() : listen())} className={`icon-btn ${listening ? "mic-on" : ""}`} aria-label={listening ? "Stop listening" : "Speak"} title="Voice input">
                  <Mic size={19} />
                </button>
              )}
              {busy ? (
                <button onClick={onStop} className="grid size-9 place-items-center rounded-full bg-pearl text-night transition hover:scale-105" aria-label="Stop generating">
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={!canSend}
                  className="bg-brand grid size-9 place-items-center rounded-full text-night shadow-[0_4px_18px_-6px_rgb(255_255_255/.5)] transition hover:scale-105 disabled:scale-100 disabled:bg-none disabled:bg-white/10 disabled:text-muted disabled:shadow-none"
                  aria-label="Send message"
                >
                  <ArrowUp size={19} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => (attach(e.target.files?.[0]), (e.target.value = ""))} />
        </div>
        <p className="mt-2 text-center text-[11px] text-muted/70">MAC Bot can make mistakes — double-check important stuff.</p>
      </div>
    </div>
  );
}
