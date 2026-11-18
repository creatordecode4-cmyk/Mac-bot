"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { ArrowDown, LayoutGrid, Menu, SquarePen } from "lucide-react";
import Bots from "./Bots";
import Composer from "./Composer";
import Mascot, { BotIcon, type Mood } from "./Mascot";
import Message from "./Message";
import Sidebar from "./Sidebar";
import { BOTS, type Bot } from "@/lib/bots";
import { loadBots, loadChats, saveBots, saveChats, store, toApi, uid, useBackClose, type Chat as ChatT, type Mode, type Msg } from "@/lib/client";

const titleFrom = (text: string) => (text.length > 42 ? `${text.slice(0, 42).trim()}…` : text) || "Image chat";

export default function Chat({ vision, provider }: { vision: boolean; provider: string }) {
  const [chats, setChats] = useState<ChatT[]>([]);
  const [myBots, setMyBots] = useState<Bot[]>([]);
  const [botId, setBotId] = useState("mac");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>("fast");
  const [busyId, setBusyId] = useState<string | null>(null); // the reply that is streaming right now
  const [drawer, setDrawer] = useState(false);
  const [sheet, setSheet] = useState(false); // the Bots screen
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const typingTimer = useRef(0);

  const bots = useMemo(() => [...BOTS, ...myBots], [myBots]);
  const bot = bots.find((b) => b.id === botId) ?? BOTS[0];
  const botChats = useMemo(() => chats.filter((c) => (c.botId ?? "mac") === bot.id), [chats, bot.id]);

  // Load once. The open chat survives a refresh (sessionStorage); a new visit starts fresh with the last bot.
  useEffect(() => {
    const saved = loadChats();
    const mine = loadBots();
    const id = [...BOTS, ...mine].find((b) => b.id === store.get("bot"))?.id ?? "mac";
    setChats(saved);
    setMyBots(mine);
    setBotId(id);
    setActiveId(saved.find((c) => c.id === store.get("active", true) && (c.botId ?? "mac") === id)?.id ?? null);
    setModeState((store.get("mode") as Mode) || "fast");
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !busyId) saveChats(chats);
  }, [chats, ready, busyId]);

  useEffect(() => {
    if (ready) saveBots(myBots);
  }, [myBots, ready]);

  useEffect(() => {
    store.set("active", activeId ?? "", true);
  }, [activeId]);

  // Keep the newest message in view while it streams — unless the user scrolled up to read.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !content.current) return;
    const ro = new ResizeObserver(() => stick.current && el.scrollTo({ top: el.scrollHeight }));
    ro.observe(content.current);
    return () => ro.disconnect();
  }, [ready]);

  useEffect(() => {
    stick.current = true;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [activeId]);

  // Only stop following when the user scrolls *up* (growing content also fires scroll events).
  const lastTop = useRef(0);
  const onScroll = () => {
    const el = scroller.current!;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    if (near) stick.current = true;
    else if (el.scrollTop < lastTop.current - 4) stick.current = false;
    lastTop.current = el.scrollTop;
    setAtBottom(stick.current);
  };

  const setMode = (m: Mode) => {
    setModeState(m);
    store.set("mode", m);
  };

  // The mascot looks down at the input while the user types.
  const onType = useCallback(() => {
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setTyping(false), 1500);
  }, []);

  useBackClose(1, sheet, () => setSheet(false));

  async function send(text: string, image?: string, base?: { chatId: string; messages: Msg[] }) {
    if (busyId) return;
    const current = chats.find((c) => c.id === (base?.chatId ?? activeId));
    const chatId = current?.id ?? uid();
    const chatBot = bots.find((b) => b.id === (current?.botId ?? bot.id)) ?? BOTS[0];
    const user: Msg = { id: uid(), role: "user", content: text, ...(image && { image }) };
    const reply: Msg = { id: uid(), role: "assistant", content: "" };
    const history = [...(base?.messages ?? current?.messages ?? []), user];

    setChats((cs) => [
      { id: chatId, botId: chatBot.id, title: current?.title ?? titleFrom(text), messages: [...history, reply], updatedAt: Date.now() },
      ...cs.filter((c) => c.id !== chatId),
    ]);
    setActiveId(chatId);
    setBusyId(reply.id);
    stick.current = true;

    const update = (patch: Partial<Msg> | ((m: Msg) => Partial<Msg>)) =>
      setChats((cs) =>
        cs.map((c) => (c.id !== chatId ? c : { ...c, messages: c.messages.map((m) => (m.id === reply.id ? { ...m, ...(typeof patch === "function" ? patch(m) : patch) } : m)) })),
      );

    const ctrl = new AbortController();
    abort.current = ctrl;
    let got = 0;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, bot: { name: chatBot.name, prompt: chatBot.prompt }, messages: toApi(history) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const { error } = await res.json().catch(() => ({ error: res.status === 429 ? "rate_limit" : "error" }));
        return update({ error });
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        got += chunk.length;
        update((m) => ({ content: m.content + chunk }));
      }
      if (!got) update({ error: "empty" });
    } catch {
      if (ctrl.signal.aborted) {
        if (!got) update({ error: "stopped" });
      } else update({ error: navigator.onLine ? "network" : "offline" });
    } finally {
      abort.current = null;
      setBusyId(null);
    }
  }

  // Retry a failed reply: drop it (and the question), then ask again.
  const retryRef = useRef<(id: string) => void>(() => {});
  retryRef.current = (replyId: string) => {
    const chat = chats.find((c) => c.messages.some((m) => m.id === replyId));
    const i = chat?.messages.findIndex((m) => m.id === replyId) ?? -1;
    const question = chat?.messages[i - 1];
    if (chat && question?.role === "user") send(question.content, question.image, { chatId: chat.id, messages: chat.messages.slice(0, i - 1) });
  };
  const onRetry = useCallback((id: string) => retryRef.current(id), []);

  const newChat = () => {
    setActiveId(null);
    setDrawer(false);
  };
  const pickBot = (id: string) => {
    setBotId(id);
    store.set("bot", id);
    newChat();
  };
  const openBots = () => {
    setDrawer(false);
    setSheet(true);
  };
  const stopIfStreaming = (inChat: (c: ChatT) => boolean) => {
    if (chats.some((c) => inChat(c) && c.messages.some((m) => m.id === busyId))) abort.current?.abort();
  };
  const remove = (id: string) => {
    stopIfStreaming((c) => c.id === id);
    setChats((cs) => cs.filter((c) => c.id !== id));
    if (id === activeId) setActiveId(null);
  };
  const saveBot = (b: Bot) => setMyBots((bs) => (bs.some((x) => x.id === b.id) ? bs.map((x) => (x.id === b.id ? b : x)) : [...bs, b]));
  const deleteBot = (id: string) => {
    stopIfStreaming((c) => c.botId === id);
    setMyBots((bs) => bs.filter((b) => b.id !== id));
    setChats((cs) => cs.filter((c) => c.botId !== id)); // its history goes with it
    if (id === botId) pickBot("mac");
  };

  const active = botChats.find((c) => c.id === activeId);
  const lastReply = active?.messages.findLast((m) => m.role === "assistant");
  const mood: Mood = busyId && lastReply?.id === busyId ? (lastReply.content ? "happy" : "thinking") : typing ? "typing" : "idle";

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh overflow-hidden" style={{ "--accent": bot.color } as CSSProperties}>
        <Sidebar
          bot={bot}
          chats={botChats}
          activeId={activeId}
          open={drawer}
          onClose={() => setDrawer(false)}
          onNew={newChat}
          onBots={openBots}
          onSelect={(id) => (setActiveId(id), setDrawer(false))}
          onRename={(id, title) => setChats((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)))}
          onDelete={remove}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[.06] px-2 sm:px-4">
            <button onClick={() => setDrawer(true)} className="icon-btn lg:hidden" aria-label="Open chat history">
              <Menu size={20} />
            </button>
            <span className="relative grid size-9 shrink-0 place-items-center">
              <span className="absolute inset-1 rounded-full bg-accent opacity-30 blur-md" />
              <BotIcon bot={bot} className="relative size-full" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{bot.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
                <span className="truncate">Online · {provider}</span>
              </p>
            </div>
            <button
              onClick={openBots}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[.04] px-3 text-xs font-semibold transition hover:border-accent/50"
              aria-label="Bots: switch or create a bot"
            >
              <LayoutGrid size={14} className="text-accent" /> Bots
            </button>
            <button onClick={newChat} className="icon-btn ml-auto" aria-label="New chat" title="New chat">
              <SquarePen size={19} />
            </button>
          </header>

          <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
            <div ref={content} className="mx-auto w-full max-w-3xl px-4 py-6">
              {ready && !active?.messages.length && (
                <div className="flex flex-col items-center pt-[4vh] text-center">
                  <Mascot bot={bot} mood={typing ? "typing" : "idle"} className="w-28 sm:w-36" />
                  <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">{bot.name}</h1>
                  <p className="mt-2 max-w-sm text-muted">{bot.greeting}</p>
                  {!!bot.starters?.length && (
                    <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
                      {bot.starters.map((s) => (
                        <button
                          key={s}
                          onClick={() => send(s.slice(s.indexOf(" ") + 1))}
                          className="glass rounded-2xl px-4 py-3.5 text-left text-sm text-pearl/85 transition hover:-translate-y-0.5 hover:border-accent/40 hover:text-pearl"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {active && (
                <div className="space-y-7">
                  {active.messages.map((m) => (
                    <Message key={m.id} msg={m} bot={bot} streaming={m.id === busyId} animate={m.id === busyId} mood={m.id === lastReply?.id ? mood : undefined} onRetry={onRetry} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            {!atBottom && (
              <button
                onClick={() => scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" })}
                className="glass absolute -top-10 left-1/2 z-10 grid size-9 -translate-x-1/2 place-items-center rounded-full text-pearl"
                aria-label="Scroll to latest"
              >
                <ArrowDown size={17} />
              </button>
            )}
            <Composer
              onSend={send}
              onStop={() => abort.current?.abort()}
              onType={onType}
              busy={!!busyId}
              mode={mode}
              setMode={setMode}
              vision={vision}
              placeholder={`Message ${bot.name}…`}
            />
          </div>
        </main>

        <AnimatePresence>
          {sheet && <Bots key="bots" bots={bots} activeId={bot.id} onPick={(id) => (history.back(), pickBot(id))} onClose={() => history.back()} onSave={saveBot} onDelete={deleteBot} />}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
