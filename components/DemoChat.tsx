"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Markdown from "./Markdown";
import { Avatar, Dots } from "./Message";
import { BOTS } from "@/lib/bots";

// A scripted conversation that plays on loop — no API calls, so it never burns your free quota.
const SCRIPT = [
  {
    user: "What side hustle can I start with $0? 💸",
    bot: "Try **resume makeovers for new grads** 🚀\n\n- Charge $29 per resume\n- Free Canva templates + me for the writing\n- First 10 clients: LinkedIn and your alumni groups\n\n**Do this today:** post one before/after sample.",
  },
  {
    user: "Explícame la recursión como si tuviera 10 años",
    bot: "Piensa en las **muñecas rusas** 🪆: abres una y dentro hay otra más pequeña, hasta llegar a la más diminuta.\n\n**Recursión** = una función que se llama a sí misma con un problema más pequeño, hasta llegar al caso más simple (el *caso base*).",
  },
  {
    user: "Tell my team on WhatsApp: launch moves to Friday 10 AM",
    bot: "Here's a crisp one ✅\n\n> 🚀 Heads up, team: the launch moves to **Friday, 10 AM**. Final checks Thursday at 4 PM.\n\n[Send on WhatsApp](app:whatsapp?text=%F0%9F%9A%80%20Heads%20up%2C%20team%3A%20the%20launch%20moves%20to%20Friday%2C%2010%20AM.%20Final%20checks%20Thursday%20at%204%20PM.)",
  },
];

type Line = { id: number; role: "user" | "bot"; text: string; typing?: boolean };

export default function DemoChat() {
  const [lines, setLines] = useState<Line[]>([]);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    let alive = true;
    let id = 0;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(600);
      while (alive) {
        for (const { user, bot } of SCRIPT) {
          if (!alive) return;
          setLines((l) => [...l.slice(-2), { id: ++id, role: "user", text: user }]);
          await wait(700);
          setThinking(true);
          await wait(1200);
          setThinking(false);
          const botId = ++id;
          for (let i = 3; alive && i < bot.length + 3; i += 3) {
            setLines((l) => [...l.filter((x) => x.id !== botId), { id: botId, role: "bot", text: bot.slice(0, i), typing: i < bot.length }]);
            await wait(24);
          }
          await wait(3200);
        }
        setLines([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div className="glass relative overflow-hidden rounded-[28px] shadow-[0_30px_100px_-30px_rgb(0_0_0/.8)]">
      <div className="flex items-center gap-3 border-b border-white/[.06] px-5 py-3.5">
        <img src="/mascot.webp" alt="" className="h-8 w-auto" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">MAC Bot</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" /> Online
          </p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="flex h-[420px] flex-col justify-end gap-5 overflow-hidden px-5 py-5 [mask-image:linear-gradient(to_bottom,transparent,black_18%)]">
        <AnimatePresence initial={false}>
          {lines.map((l, i) =>
            l.role === "user" ? (
              <motion.div key={l.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-end">
                <p className="bubble max-w-[85%] rounded-3xl rounded-br-lg px-4 py-2.5 text-sm">{l.text}</p>
              </motion.div>
            ) : (
              <motion.div key={l.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3 text-sm">
                <Avatar bot={BOTS[0]} mood={i === lines.length - 1 ? (l.typing ? "happy" : "idle") : undefined} />
                <div className="min-w-0 flex-1 pt-1">
                  <Markdown text={l.text} typing={l.typing} />
                </div>
              </motion.div>
            ),
          )}
          {thinking && (
            <motion.div key="thinking" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3">
              <Avatar bot={BOTS[0]} mood="thinking" />
              <Dots />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Link href="/chat" className="m-3 mt-0 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.03] py-2 pl-4 pr-2 text-sm text-muted transition hover:border-white/25">
        Ask MAC Bot anything…
        <span className="bg-brand ml-auto grid size-8 place-items-center rounded-full text-night">
          <ArrowUp size={16} strokeWidth={2.5} />
        </span>
      </Link>
    </div>
    </MotionConfig>
  );
}
