"use client";

import { memo, useEffect, useState } from "react";
import { Check, Copy, RotateCcw, Square, Volume2 } from "lucide-react";
import Markdown from "./Markdown";
import { ERRORS, speak, useTypewriter, type Msg } from "@/lib/client";

export function Avatar({ thinking = false }: { thinking?: boolean }) {
  return (
    <div className={`relative mt-0.5 size-8 shrink-0 ${thinking ? "animate-think" : ""}`}>
      <span className="absolute inset-0.5 rounded-full bg-gradient-to-br from-cyan/40 to-violet/40 blur-md" />
      <img src="/mascot.webp" alt="" className="relative size-full object-contain" />
    </div>
  );
}

export function Dots() {
  return (
    <div className="dots flex h-7 items-center gap-1.5" aria-label="MAC Bot is thinking">
      <span />
      <span />
      <span />
    </div>
  );
}

function Actions({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => setCanSpeak("speechSynthesis" in window), []);
  useEffect(() => () => void (speaking && speechSynthesis.cancel()), [speaking]);

  const copy = () =>
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  const toggleSpeak = () => {
    if (speaking) return speechSynthesis.cancel();
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  };

  return (
    <div className="-ml-2 mt-1.5 flex gap-0.5">
      <button onClick={copy} className="icon-btn size-8" aria-label="Copy reply" title="Copy">
        {copied ? <Check size={15} className="text-cyan" /> : <Copy size={15} />}
      </button>
      {canSpeak && (
        <button onClick={toggleSpeak} className={`icon-btn size-8 ${speaking ? "text-cyan" : ""}`} aria-label={speaking ? "Stop reading" : "Read aloud"} title={speaking ? "Stop" : "Read aloud"}>
          {speaking ? <Square size={13} fill="currentColor" /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}

function Message({ msg, streaming, animate, onRetry }: { msg: Msg; streaming: boolean; animate: boolean; onRetry: (id: string) => void }) {
  const shown = useTypewriter(msg.content, animate);
  const typing = streaming || shown.length < msg.content.length;

  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2">
        {msg.image && <img src={msg.image} alt="Your upload" className="max-h-64 max-w-[75%] rounded-2xl border border-white/10 object-cover" />}
        {msg.content && (
          <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg border border-white/10 bg-gradient-to-br from-violet/30 to-cyan/[.12] px-4 py-2.5 text-[15px] leading-relaxed shadow-[0_8px_30px_-12px_rgb(139_92_246/.5)]">
            {msg.content}
          </div>
        )}
      </div>
    );
  }

  const thinking = streaming && !msg.content;
  return (
    <div className="flex gap-3">
      <Avatar thinking={thinking} />
      <div className="min-w-0 flex-1 pt-0.5 text-[15px]">
        {thinking ? <Dots /> : shown && <Markdown text={shown} typing={typing} />}
        {msg.error && (
          <div className={`flex flex-wrap items-center gap-3 ${msg.content ? "mt-3" : ""}`}>
            <p className={`rounded-2xl border px-4 py-2.5 leading-relaxed ${msg.error === "stopped" ? "border-white/10 text-muted" : "border-violet/30 bg-violet/10"}`}>
              {ERRORS[msg.error] ?? ERRORS.error}
            </p>
            <button onClick={() => onRetry(msg.id)} className="flex items-center gap-1.5 text-sm text-cyan hover:underline">
              <RotateCcw size={14} /> Try again
            </button>
          </div>
        )}
        {!typing && msg.content && <Actions text={msg.content} />}
      </div>
    </div>
  );
}

export default memo(Message);
