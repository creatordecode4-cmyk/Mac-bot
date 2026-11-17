"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Brain, Briefcase, ImagePlus, Mic, Square, X, Zap } from "lucide-react";
import { resizeImage, store, type Mode } from "@/lib/client";

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
  busy: boolean;
  mode: Mode;
  setMode: (m: Mode) => void;
  vision: boolean;
}) {
  const { onSend, onStop, busy, mode, setMode, vision } = props;
  const [text, setText] = useState("");
  const [image, setImage] = useState<string>();
  const [voice, setVoice] = useState(false);
  const [lang, setLang] = useState("hi-IN");
  const [listening, setListening] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const rec = useRef<Recognition | null>(null);
  const canSend = !busy && (!!text.trim() || !!image);

  useEffect(() => {
    setVoice(!!Speech());
    setLang(store.get("voice") ?? "hi-IN");
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

  const listen = (l = lang) => {
    const SR = Speech();
    if (!SR) return;
    rec.current?.abort();
    const r = new SR();
    r.lang = l;
    r.interimResults = true;
    const before = text.trim() ? `${text.trim()} ` : "";
    r.onresult = (e) => setText(before + Array.from(e.results as ArrayLike<{ 0: { transcript: string } }>).map((x) => x[0].transcript).join(""));
    r.onend = () => {
      if (rec.current === r) {
        rec.current = null;
        setListening(false);
      }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") alert("Microphone permission is blocked — allow it in your browser settings.");
    };
    rec.current = r;
    r.start();
    setListening(true);
  };

  const switchLang = () => {
    const next = lang === "hi-IN" ? "en-IN" : "hi-IN";
    setLang(next);
    store.set("voice", next);
    listen(next);
  };

  return (
    <div className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
      <div className="mx-auto max-w-3xl">
        <div className="glass rounded-[26px] p-2 shadow-[0_0_50px_-20px_rgb(139_92_246/.6)] transition-[border-color,box-shadow] duration-300 focus-within:border-cyan/30 focus-within:shadow-[0_0_60px_-18px_rgb(34_229_255/.45)]">
          {listening && (
            <div className="flex items-center gap-2 px-3 pt-1.5 text-xs">
              <span className="size-2 animate-pulse rounded-full bg-cyan shadow-[0_0_8px] shadow-cyan" />
              <span className="text-cyan">Listening · {lang === "hi-IN" ? "हिंदी" : "English"}</span>
              <button onClick={switchLang} className="ml-auto text-muted underline-offset-2 hover:text-pearl hover:underline">
                Switch to {lang === "hi-IN" ? "English" : "हिंदी"}
              </button>
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
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            onPaste={onPaste}
            placeholder="Ask MAC Bot anything…"
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
                  <span className={`relative ${mode === id ? "" : "hidden sm:inline"}`}>{label}</span>
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {vision && (
                <button onClick={() => file.current?.click()} className="icon-btn" aria-label="Attach an image" title="Attach image">
                  <ImagePlus size={19} />
                </button>
              )}
              {voice && (
                <button onClick={() => (listening ? rec.current?.stop() : listen())} className={`icon-btn ${listening ? "mic-on" : ""}`} aria-label={listening ? "Stop listening" : "Speak (Hindi or English)"} title="Voice input">
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
                  className="bg-brand grid size-9 place-items-center rounded-full text-night shadow-[0_0_20px_-4px_rgb(34_229_255/.6)] transition hover:scale-105 disabled:scale-100 disabled:bg-none disabled:bg-white/10 disabled:text-muted disabled:shadow-none"
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
