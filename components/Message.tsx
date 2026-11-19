"use client";

import { memo, useEffect, useState } from "react";
import { Check, Copy, RotateCcw, Share2, Square, Volume2 } from "lucide-react";
import Markdown from "./Markdown";
import Mascot, { BotIcon, type Mood } from "./Mascot";
import { withoutAppLinks } from "@/lib/apps";
import type { Bot } from "@/lib/bots";
import { ERRORS, speak, useTypewriter, type Msg } from "@/lib/client";

/** With a mood the avatar is alive (only the newest reply); otherwise it's a still image. */
export function Avatar({ bot, mood }: { bot: Bot; mood?: Mood }) {
  return (
    <div className="relative mt-0.5 flex size-8 shrink-0 justify-center">
      <span className="absolute inset-1 rounded-full opacity-35 blur-md" style={{ background: bot.color }} />
      {mood ? <Mascot bot={bot} mood={mood} className="h-full" /> : <BotIcon bot={bot} className="relative size-full" />}
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
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanSpeak("speechSynthesis" in window);
    setCanShare("share" in navigator);
  }, []);
  useEffect(() => () => void (speaking && speechSynthesis.cancel()), [speaking]);

  const copy = () =>
    navigator.clipboard?.writeText(withoutAppLinks(text)).then(() => {
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
        {copied ? <Check size={15} className="text-pearl" /> : <Copy size={15} />}
      </button>
      {canShare && (
        // The phone's share sheet: send any reply to any app (Instagram, Slack, Notes…).
        <button onClick={() => navigator.share({ text: withoutAppLinks(text) }).catch(() => {})} className="icon-btn size-8" aria-label="Share reply" title="Share to any app">
          <Share2 size={15} />
        </button>
      )}
      {canSpeak && (
        <button onClick={toggleSpeak} className={`icon-btn size-8 ${speaking ? "text-pearl" : ""}`} aria-label={speaking ? "Stop reading" : "Read aloud"} title={speaking ? "Stop" : "Read aloud"}>
          {speaking ? <Square size={13} fill="currentColor" /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
}

type Props = { msg: Msg; bot: Bot; streaming: boolean; animate: boolean; mood?: Mood; onRetry: (id: string) => void };

function Message({ msg, bot, streaming, animate, mood, onRetry }: Props) {
  const shown = useTypewriter(msg.content, animate);
  const typing = streaming || shown.length < msg.content.length;

  if (msg.role === "user") {
    return (
      <div className="flex flex-col items-end gap-2">
        {msg.image && <img src={msg.image} alt="Your upload" className="max-h-64 max-w-[75%] rounded-2xl border border-white/10 object-cover" />}
        {msg.content && (
          <div dir="auto" className="bubble max-w-[85%] whitespace-pre-wrap break-words rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px] leading-relaxed">
            {msg.content}
          </div>
        )}
      </div>
    );
  }

  const thinking = streaming && !msg.content;
  return (
    <div className="flex gap-3">
      <Avatar bot={bot} mood={mood} />
      <div className="min-w-0 flex-1 pt-0.5 text-[15px]">
        {thinking ? <Dots /> : shown && <Markdown text={shown} typing={typing} />}
        {msg.error && (
          <div className={`flex flex-wrap items-center gap-3 ${msg.content ? "mt-3" : ""}`}>
            <p className={`rounded-2xl border px-4 py-2.5 leading-relaxed ${msg.error === "stopped" ? "border-white/10 text-muted" : "border-white/12 bg-white/[.06]"}`}>
              {ERRORS[msg.error] ?? ERRORS.error}
            </p>
            <button onClick={() => onRetry(msg.id)} className="flex h-8 items-center gap-1.5 rounded-full border border-white/12 bg-white/[.05] px-3 text-sm font-medium transition hover:border-white/25 hover:bg-white/[.09]">
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
