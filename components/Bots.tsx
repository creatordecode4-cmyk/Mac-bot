"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Pencil, Plus, Trash, Upload } from "lucide-react";
import BotEditor from "./BotEditor";
import { BotIcon } from "./Mascot";
import { botFile, parseBot, type Bot } from "@/lib/bots";
import { useBackClose } from "@/lib/client";

type Props = {
  bots: Bot[];
  activeId: string;
  onPick: (id: string) => void;
  onClose: () => void;
  onSave: (bot: Bot) => void;
  onDelete: (id: string) => void;
};

const NEW: Bot = { id: "", name: "", tagline: "", avatar: "mascot", color: "#8B5CF6", greeting: "", prompt: "", custom: true };

/** Save a bot as a .json file that anyone can import. */
function download(bot: Bot) {
  const url = URL.createObjectURL(new Blob([botFile(bot)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${bot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bot"}.macbot.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[.16em] text-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default function Bots({ bots, activeId, onPick, onClose, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<Bot | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useBackClose(2, !!editing, () => setEditing(null));
  // Grid ⇄ editor always opens at the top. (Block body: scrollTo() can return a Promise, which isn't a cleanup.)
  useEffect(() => {
    sheet.current?.scrollTo({ top: 0 });
  }, [editing]);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  const importFile = async (f?: File) => {
    const bot = f ? parseBot(await f.text()) : null;
    setNote(bot ? "" : "That file isn't a MAC Bot bot. Choose a .json file exported from MAC Bot.");
    if (bot) setEditing(bot); // preview it in the editor before saving
  };

  const card = (bot: Bot) => (
    <div
      key={bot.id}
      style={{ "--accent": bot.color } as CSSProperties}
      className={`glass relative flex flex-col rounded-3xl transition duration-300 hover:-translate-y-0.5 ${bot.id === activeId ? "border-accent/60 shadow-[0_0_32px_-12px_var(--accent)]" : "hover:border-accent/40"}`}
    >
      <button onClick={() => onPick(bot.id)} className="flex flex-1 flex-col items-start p-4 text-left" aria-label={`Chat with ${bot.name}`}>
        <BotIcon bot={bot} className="size-12" />
        <span className="mt-3 font-semibold leading-tight">{bot.name}</span>
        <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{bot.tagline}</span>
      </button>
      {bot.id === activeId && <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">Active</span>}
      {bot.custom && (
        <div className="flex items-center gap-0.5 border-t border-white/[.06] px-2 py-1.5">
          <button onClick={() => setEditing(bot)} className="icon-btn size-8" aria-label={`Edit ${bot.name}`}>
            <Pencil size={14} />
          </button>
          <button onClick={() => download(bot)} className="icon-btn size-8" aria-label={`Export ${bot.name}`}>
            <Download size={14} />
          </button>
          {confirm === bot.id ? (
            <button onClick={() => onDelete(bot.id)} className="ml-auto rounded-lg bg-red-500/15 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/25">
              Delete?
            </button>
          ) : (
            <button onClick={() => setConfirm(bot.id)} className="icon-btn ml-auto size-8 hover:text-red-300" aria-label={`Delete ${bot.name}`}>
              <Trash size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  const mine = bots.filter((b) => b.custom);
  return (
    <motion.div
      ref={sheet}
      role="dialog"
      aria-label="Bots"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ "--accent": "#22E5FF" } as CSSProperties}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-night/95 backdrop-blur-xl"
    >
      {editing ? (
        <BotEditor
          bot={editing}
          onCancel={() => history.back()}
          onSave={(b) => (onSave(b), history.back())}
          onDelete={(id) => (onDelete(id), history.back())}
          onExport={download}
        />
      ) : (
        <div className="mx-auto max-w-5xl px-4 pb-12">
          <header className="sticky top-0 z-10 -mx-4 flex h-14 items-center gap-2 bg-night/80 px-2 backdrop-blur-xl sm:px-4">
            <button onClick={onClose} className="icon-btn" aria-label="Back to chat">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold tracking-tight">Bots</h2>
            <button onClick={() => file.current?.click()} className="ml-auto flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3.5 text-sm font-medium transition hover:border-white/20">
              <Upload size={15} /> Import
            </button>
            <input ref={file} type="file" accept=".json,application/json" hidden onChange={(e) => (importFile(e.target.files?.[0]), (e.target.value = ""))} />
          </header>
          <p className="mt-1 text-sm text-muted">Pick a friend for the job, or build your own.</p>
          {note && <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{note}</p>}
          <button
            onClick={() => setEditing(NEW)}
            className="mt-5 flex w-full items-center gap-4 rounded-3xl border border-dashed border-white/15 bg-white/[.02] p-4 text-left transition hover:border-cyan/40 hover:bg-white/[.04]"
          >
            <span className="bg-brand grid size-12 shrink-0 place-items-center rounded-2xl text-night shadow-[0_0_24px_-6px_rgb(34_229_255/.6)]">
              <Plus size={22} strokeWidth={2.5} />
            </span>
            <span>
              <span className="block font-semibold">Create your own bot</span>
              <span className="block text-sm text-muted">Name it, give it a look and a personality. Share it as a file.</span>
            </span>
          </button>
          {mine.length > 0 && <Section title="Your bots">{mine.map(card)}</Section>}
          <Section title="Built-in">{bots.filter((b) => !b.custom).map(card)}</Section>
        </div>
      )}
    </motion.div>
  );
}
