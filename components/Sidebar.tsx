"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MessageSquare, Pencil, Plus, Trash, X } from "lucide-react";
import type { Chat } from "@/lib/client";

type Props = {
  chats: Chat[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
};

function Item({ chat, active, onSelect, onRename, onDelete }: { chat: Chat; active: boolean } & Pick<Props, "onSelect" | "onRename" | "onDelete">) {
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  const save = (value: string) => {
    if (value.trim()) onRename(chat.id, value.trim().slice(0, 80));
    setEditing(false);
  };

  return (
    <div className={`group flex items-center gap-1 rounded-xl pl-3 pr-1 transition ${active ? "bg-white/[.08] text-pearl" : "text-pearl/75 hover:bg-white/[.04]"}`}>
      <MessageSquare size={14} className={`shrink-0 ${active ? "text-cyan" : "text-muted"}`} />
      {editing ? (
        <input
          autoFocus
          defaultValue={chat.title}
          aria-label="Chat name"
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save(e.currentTarget.value);
            if (e.key === "Escape") setEditing(false);
          }}
          className="min-w-0 flex-1 rounded-md bg-white/10 px-2 py-2 text-sm outline-none ring-1 ring-cyan/40"
        />
      ) : (
        <button onClick={() => onSelect(chat.id)} className="min-w-0 flex-1 truncate py-2.5 pl-1 text-left text-sm">
          {chat.title}
        </button>
      )}
      {confirm ? (
        <>
          <button onClick={() => onDelete(chat.id)} className="rounded-lg bg-red-500/15 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/25">
            Delete
          </button>
          <button onClick={() => setConfirm(false)} className="icon-btn size-7" aria-label="Cancel delete">
            <X size={14} />
          </button>
        </>
      ) : (
        !editing && (
          <div className={`flex transition-opacity ${active ? "" : "opacity-60 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"}`}>
            <button onClick={() => setEditing(true)} className="icon-btn size-7" aria-label={`Rename ${chat.title}`}>
              <Pencil size={13} />
            </button>
            <button onClick={() => setConfirm(true)} className="icon-btn size-7 hover:text-red-300" aria-label={`Delete ${chat.title}`}>
              <Trash size={13} />
            </button>
          </div>
        )
      )}
      {editing && (
        // Tapping this blurs the input, which saves the new name.
        <button className="icon-btn size-7 text-cyan" aria-label="Save name">
          <Check size={14} />
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ chats, activeId, open, onClose, onNew, ...item }: Props) {
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[284px] flex-col border-r border-white/[.06] bg-[#09090f]/95 backdrop-blur-xl transition-transform duration-300 ease-out lg:static lg:translate-x-0 lg:bg-white/[.015] ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Chat history"
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <img src="/mascot.webp" alt="" className="h-7 w-auto" />
            MAC Bot
          </Link>
          <button onClick={onClose} className="icon-btn ml-auto lg:hidden" aria-label="Close chat history">
            <X size={18} />
          </button>
        </div>
        <div className="px-3 pt-1">
          <button onClick={onNew} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] text-sm font-medium transition hover:border-cyan/30 hover:bg-white/[.07]">
            <Plus size={16} className="text-cyan" /> New chat
          </button>
        </div>
        <nav className="mt-5 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.14em] text-muted">Recent</p>
          {chats.length ? (
            chats.map((c) => <Item key={c.id} chat={c} active={c.id === activeId} {...item} />)
          ) : (
            <p className="px-3 text-sm text-muted">No chats yet. Say hi! 👋</p>
          )}
        </nav>
        <p className="border-t border-white/[.06] px-4 py-3 text-xs text-muted">🔒 Your chats are saved only on this device.</p>
      </aside>
    </>
  );
}
