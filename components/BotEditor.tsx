"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Ban, Download, Sparkles, Trash } from "lucide-react";
import Mascot, { BADGES, BotIcon } from "./Mascot";
import type { Bot } from "@/lib/bots";
import { ERRORS, uid } from "@/lib/client";

const COLORS = ["#22E5FF", "#8B5CF6", "#F9E93A", "#FFA600", "#FB6603", "#F3223F", "#FF3DC2", "#4886FE", "#4CEF60"];
const field = "w-full rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-base outline-none transition placeholder:text-muted/70 focus:border-accent/60";

function Field({ label, action, children }: { label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex min-h-8 items-center justify-between gap-2">
        <span className="text-sm font-medium text-pearl/90">{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

type Props = { bot: Bot; onSave: (bot: Bot) => void; onCancel: () => void; onDelete: (id: string) => void; onExport: (bot: Bot) => void };

export default function BotEditor({ bot, onSave, onCancel, onDelete, onExport }: Props) {
  const [f, setF] = useState(bot);
  const [drafting, setDrafting] = useState(false);
  const [hint, setHint] = useState("");
  const [confirm, setConfirm] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const set = (patch: Partial<Bot>) => setF((v) => ({ ...v, ...patch }));
  const name = f.name.trim();
  const valid = !!name && !!f.prompt.trim();
  const greeting = f.greeting.trim() || `Hi! I'm ${name || "your new bot"} 👋 ${f.tagline.trim()}`.trim();
  const saved = !!bot.id;
  const customEmoji = f.badge in BADGES ? "" : f.badge;

  // "Make it with AI": stream bot instructions from the one-line description.
  async function draft() {
    const idea = (f.tagline || f.name).trim();
    if (!idea) return setHint("Write a one-line description first, e.g. “A patient chess coach for beginners”.");
    ctrl.current?.abort();
    const c = (ctrl.current = new AbortController());
    setHint("");
    setDrafting(true);
    set({ prompt: "" });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "draft", idea, name }),
        signal: c.signal,
      });
      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: "error" }));
        return setHint(ERRORS[error] ?? ERRORS.error);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setF((v) => ({ ...v, prompt: (v.prompt + text).slice(0, 4000) }));
      }
    } catch {
      if (!c.signal.aborted) setHint(ERRORS.network);
    } finally {
      setDrafting(false);
    }
  }

  const save = () => valid && onSave({ ...f, id: f.id || uid(), name, tagline: f.tagline.trim(), prompt: f.prompt.trim(), greeting, custom: true });

  return (
    <div style={{ "--accent": f.color } as CSSProperties} className="mx-auto max-w-2xl px-4 pb-16">
      <header className="sticky top-0 z-10 -mx-4 flex h-14 items-center gap-2 bg-night/60 px-2 backdrop-blur-xl sm:px-4">
        <button onClick={onCancel} className="icon-btn" aria-label="Back to bots">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold tracking-tight">{saved ? "Edit bot" : "Create your bot"}</h2>
        <button onClick={save} disabled={!valid} className="bg-brand ml-auto h-9 rounded-full px-5 text-sm font-semibold text-night transition disabled:opacity-40">
          Save
        </button>
      </header>

      <section aria-label="Preview" className="glass mt-2 rounded-3xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted">Preview</p>
        <div className="mt-4 flex items-center gap-4">
          <Mascot bot={f} className="w-16 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{name || "Your bot"}</p>
            <p className="line-clamp-2 text-sm text-muted">{f.tagline.trim() || "A one-line description"}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <BotIcon bot={f} className="size-8 shrink-0" />
          <p className="rounded-2xl rounded-tl-md border border-white/[.06] bg-white/[.04] px-4 py-2.5 text-sm leading-relaxed">{greeting}</p>
        </div>
      </section>

      <Field label="Name">
        <input value={f.name} onChange={(e) => set({ name: e.target.value })} maxLength={40} placeholder="Chess Coach" aria-label="Name" className={field} />
      </Field>

      <Field label="One-line description">
        <input
          value={f.tagline}
          onChange={(e) => set({ tagline: e.target.value })}
          maxLength={90}
          placeholder="A patient chess coach for beginners"
          aria-label="One-line description"
          className={field}
        />
      </Field>

      <Field label="Badge">
        <div className="flex flex-wrap gap-2">
          {["", ...Object.keys(BADGES)].map((b) => {
            const Icon = BADGES[b] ?? Ban;
            return (
              <button
                key={b || "none"}
                onClick={() => set({ badge: b })}
                aria-label={b ? `Badge ${b}` : "No badge"}
                aria-pressed={f.badge === b}
                className={`grid size-11 place-items-center rounded-2xl border transition ${f.badge === b ? "border-accent bg-accent/15 text-accent" : "border-white/10 bg-white/[.03] text-muted hover:border-white/25 hover:text-pearl"}`}
              >
                <Icon size={19} />
              </button>
            );
          })}
          <input
            value={customEmoji}
            onChange={(e) => set({ badge: e.target.value.trim() })}
            maxLength={12}
            placeholder="Any emoji"
            aria-label="Any emoji badge"
            className={`h-11 w-28 rounded-2xl border bg-white/[.03] px-3 text-center text-base outline-none placeholder:text-sm placeholder:text-muted/70 ${customEmoji ? "border-accent" : "border-white/10"}`}
          />
        </div>
        <p className="mt-2 text-xs text-muted">A tiny role icon on your mascot&apos;s corner. The mascot takes your accent color below.</p>
      </Field>

      <Field label="Accent color">
        <div className="flex flex-wrap items-center gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => set({ color: c })}
              aria-label={`Color ${c}`}
              aria-pressed={f.color.toLowerCase() === c.toLowerCase()}
              className={`size-9 rounded-full ring-2 ring-offset-2 ring-offset-night transition ${f.color.toLowerCase() === c.toLowerCase() ? "ring-pearl" : "ring-transparent"}`}
              style={{ background: c }}
            />
          ))}
          <label title="Pick any color" className="relative size-9 cursor-pointer rounded-full bg-[conic-gradient(#f87171,#facc15,#34d399,#22e5ff,#8b5cf6,#f472b6,#f87171)]">
            <input type="color" value={f.color} onChange={(e) => set({ color: e.target.value })} aria-label="Pick any color" className="absolute inset-0 size-full cursor-pointer opacity-0" />
          </label>
        </div>
      </Field>

      <Field
        label="Personality & instructions"
        action={
          <button
            onClick={draft}
            disabled={drafting}
            className="bg-brand flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-night shadow-[0_4px_18px_-6px_rgb(255_255_255/.5)] transition hover:scale-[1.03] disabled:opacity-60"
          >
            <Sparkles size={13} className={drafting ? "animate-pulse" : ""} />
            {drafting ? "Writing…" : "Make it with AI"}
          </button>
        }
      >
        <textarea
          value={f.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          rows={8}
          maxLength={4000}
          placeholder="Who is this bot? How does it talk? What does it help with? Any rules?"
          aria-label="Personality & instructions"
          className={`${field} resize-y leading-relaxed`}
        />
        <p className={`mt-2 text-sm ${hint ? "text-pearl" : "text-xs text-muted"}`}>{hint || "Tip: write a one-line description, then tap “Make it with AI”."}</p>
      </Field>

      <Field label="Greeting message">
        <input value={f.greeting} onChange={(e) => set({ greeting: e.target.value })} maxLength={240} placeholder={greeting} aria-label="Greeting message" className={field} />
      </Field>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={!valid} className="btn-primary disabled:opacity-40">
          Save bot
        </button>
        {saved && (
          <button onClick={() => onExport(f)} className="btn-ghost">
            <Download size={16} /> Export
          </button>
        )}
        {saved &&
          (confirm ? (
            <button onClick={() => onDelete(bot.id)} className="btn-ghost border-red-400/40 text-red-300">
              Tap again to delete
            </button>
          ) : (
            <button onClick={() => setConfirm(true)} className="btn-ghost text-red-300">
              <Trash size={16} /> Delete
            </button>
          ))}
      </div>
    </div>
  );
}
