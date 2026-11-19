"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionStyle, type Transition } from "framer-motion";
import { BookOpen, Briefcase, Camera, ChefHat, Code, Dumbbell, GraduationCap, Heart, Languages, Leaf, Lightbulb, Palette, PawPrint, Plane, Scale, Stethoscope, Trophy, type LucideIcon } from "lucide-react";
import { BOTS, type Bot } from "@/lib/bots";

export type Mood = "idle" | "typing" | "thinking" | "happy";
type Face = Pick<Bot, "badge" | "color">;

/** Role badges for the mascot's corner (built-in bots use the first seven). Custom bots can also use an emoji. */
export const BADGES: Record<string, LucideIcon> = {
  briefcase: Briefcase, book: BookOpen, code: Code, dumbbell: Dumbbell, chef: ChefHat, bulb: Lightbulb, languages: Languages,
  grad: GraduationCap, palette: Palette, heart: Heart, health: Stethoscope, law: Scale, travel: Plane, pets: PawPrint, nature: Leaf, sport: Trophy, camera: Camera,
};

const MAC = "#22e5ff"; // MAC Bot keeps the original cyan-and-violet art
// The eyes are separate layers cut from /public/bot.png so they can look around, blink and smile.
// Positions are % of the mascot box (784×954 px in the source image).
const EYES = [
  { side: "l", left: "2.42%", top: "39.83%" },
  { side: "r", left: "43.24%", top: "43.61%" },
];
// Happy "^ ^" eyes drawn over each eye (centre cx, cy) in the same 784×954 box, tilted with the face.
const SMILE = [
  { d: "M115 553Q171 473 227 553", cx: 171, cy: 531 },
  { d: "M434 590Q490 510 546 590", cx: 490, cy: 568 },
];
// Where the eyes glance while thinking, as a share of the mascot's width: left, right, up, up-left, up-right, at you.
const GLANCES = [[-0.065, 0], [0.065, 0], [0, -0.06], [-0.045, -0.05], [0.045, -0.05], [0, 0]];

/** Paint `color` through an image's alpha channel. */
const paint = (color: string, url: string) => ({
  background: color,
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
});
/** Dark or white icon, whichever reads better on `color`. */
const ink = (color: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? "#07070C" : "#FFFFFF";
};

export function Badge({ badge, color, className = "" }: { badge: string; color: string; className?: string }) {
  const Icon = BADGES[badge];
  return (
    <span className={`@container grid aspect-square place-items-center rounded-full shadow-[0_0_0_2px_var(--color-night)] ${className}`} style={{ background: color, color: ink(color) }}>
      {Icon ? <Icon className="size-[60cqw]" strokeWidth={2.5} /> : <span className="text-[62cqw] leading-none">{badge}</span>}
    </span>
  );
}

/**
 * The mascot's layers. MAC Bot shows the original art; every other bot gets a neutral white body
 * whose lights (rim, smile, blush, antenna) and eyes are painted in its own color, keeping the white highlights.
 */
function Layers({ bot, eye, children }: { bot: Face; eye?: MotionStyle; children?: ReactNode }) {
  const original = bot.color.toLowerCase() === MAC;
  return (
    <>
      {original ? (
        <img src="/mascot-body.webp" alt="" draggable={false} className="absolute inset-0 size-full" />
      ) : (
        <>
          <img src="/mascot-base.webp" alt="" draggable={false} className="absolute inset-0 size-full" />
          <span className="absolute inset-0" style={paint(bot.color, "/mascot-tint.webp")} />
        </>
      )}
      {EYES.map(({ side, left, top }) => (
        <motion.span key={side} className="absolute aspect-square w-[38.52%] mix-blend-plus-lighter" style={{ left, top, ...eye }}>
          {original ? (
            <img src={`/mascot-eye-${side}.webp`} alt="" draggable={false} className="absolute inset-0 size-full" />
          ) : (
            <>
              <span className="absolute inset-0" style={paint(bot.color, `/mascot-eye-${side}.webp`)} />
              <span className="absolute inset-0" style={paint("#fff", `/mascot-eye-${side}-core.webp`)} />
            </>
          )}
        </motion.span>
      ))}
      {children}
      {bot.badge && <Badge badge={bot.badge} color={bot.color} className="absolute bottom-[3%] right-[-3%] w-[max(10px,36%)]" />}
    </>
  );
}

/** Still logo: the bot's mascot in its color, with its role badge. */
export function BotIcon({ bot, className = "" }: { bot: Face; className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center ${className}`}>
      <span className="relative aspect-[784/954] h-full">
        <Layers bot={bot} />
      </span>
    </span>
  );
}

/** Living mascot: floats and blinks, glances around, spins while thinking, bounces with a smile when a reply arrives. */
export default function Mascot({ bot = BOTS[0], mood = "idle", className = "" }: { bot?: Face; mood?: Mood; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const x = useMotionValue(0); // eye gaze, px
  const y = useMotionValue(0);
  const lean = useMotionValue(0); // body tilt toward the pointer, deg
  const lid = useMotionValue(1); // blink
  const spin = useMotionValue(0); // Y-axis spin, deg
  const hop = useMotionValue(0); // bounce, px
  const squash = useMotionValue(1);
  const smile = useMotionValue(0); // 1 = happy ^ ^ eyes
  const eyes = useTransform(smile, (v) => 1 - v);
  const pop = useTransform(smile, [0, 1], [0.6, 1]);
  const stretch = useTransform(squash, (v) => 2 - v);

  // A random blink every few seconds.
  useEffect(() => {
    if (still) return;
    let timer = 0;
    const blink = () => {
      animate(lid, [1, 0.08, 1], { duration: 0.22, ease: "easeInOut" });
      timer = window.setTimeout(blink, 2200 + Math.random() * 3800);
    };
    timer = window.setTimeout(blink, 1000 + Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [lid, still]);

  // One-off moves on a mood change: a 360° spin to start thinking, a happy bounce and smiling eyes for a reply.
  // They play to the end even if the mood moves on (a short reply can finish streaming in a few milliseconds).
  const smileTimer = useRef(0);
  useEffect(() => () => clearTimeout(smileTimer.current), []);
  useEffect(() => {
    if (mood === "thinking") {
      clearTimeout(smileTimer.current);
      animate(smile, 0, { duration: 0.2 });
      if (!still) animate(spin, [0, 360], { duration: 1, ease: [0.65, 0, 0.35, 1] });
    }
    if (mood !== "happy") return;
    if (!still) {
      const w = box.current?.offsetWidth ?? 100;
      const times = [0, 0.28, 0.55, 0.78, 1];
      animate(hop, [0, -0.1 * w, 0, -0.035 * w, 0], { duration: 0.75, times, ease: "easeOut" });
      animate(squash, [1, 1.06, 0.92, 1.02, 1], { duration: 0.75, times, ease: "easeOut" });
    }
    animate(smile, 1, { duration: 0.2 });
    clearTimeout(smileTimer.current);
    smileTimer.current = window.setTimeout(() => animate(smile, 0, { duration: 0.35 }), 1500);
  }, [mood, still, spin, hop, squash, smile]);

  // Where the eyes look: wander when idle (and follow the pointer), dart around while thinking, look down at the input while typing.
  useEffect(() => {
    const look = (fx: number, fy: number, how: Transition) => {
      const w = box.current?.offsetWidth ?? 100;
      animate(x, fx * w, how);
      animate(y, fy * w, how);
    };
    if (still) {
      look(0, 0, { duration: 0 });
      return;
    }
    let timer = 0;
    let followedAt = 0;
    const loop = () => {
      if (mood === "typing") return look(0, 0.07, { duration: 0.3, ease: "easeOut" });
      if (mood === "happy") return look(0, 0, { duration: 0.2 });
      if (mood === "thinking") {
        const [fx, fy] = GLANCES[Math.floor(Math.random() * GLANCES.length)];
        look(fx, fy, { duration: 0.35, ease: "easeOut" });
      } else if (Date.now() - followedAt > 2500) {
        // Idle: drift slowly, and about a third of the time look straight at the user.
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() < 0.35 ? 0 : 0.02 + Math.random() * 0.03;
        look(Math.cos(a) * r, Math.sin(a) * r * 0.8, { duration: 1.6, ease: "easeInOut" });
        animate(lean, 0, { duration: 1.6 });
      }
      timer = window.setTimeout(loop, mood === "thinking" ? 550 + Math.random() * 650 : 2000 + Math.random() * 2500);
    };
    animate(lean, 0, { duration: 0.4 });
    loop();
    const follow = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (mood !== "idle" || !r) return;
      followedAt = Date.now();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.58);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / (r.width * 1.2)); // look harder the farther away the pointer is
      const spring = { type: "spring", stiffness: 140, damping: 16, mass: 0.5 } as const;
      look((dx / d) * k * 0.045, (dy / d) * k * 0.035, spring);
      animate(lean, (dx / d) * k * 5, spring);
    };
    addEventListener("pointermove", follow, { passive: true });
    addEventListener("pointerdown", follow, { passive: true });
    return () => {
      clearTimeout(timer);
      removeEventListener("pointermove", follow);
      removeEventListener("pointerdown", follow);
    };
  }, [mood, still, x, y, lean]);

  const glow = bot.color.toLowerCase() === MAC ? "rgb(139 92 246 / 0.45)" : `${bot.color}55`;
  return (
    <div ref={box} className={`relative aspect-[784/954] select-none ${className}`}>
      <div
        aria-hidden
        className="mascot-glow animate-shadow absolute -bottom-[6%] left-[15%] h-[11%] w-[70%] rounded-[50%]"
        style={{ background: `radial-gradient(closest-side, ${bot.color}99, ${glow} 55%, transparent)` }}
      />
      <div className="animate-float absolute inset-0">
        <motion.div className="absolute inset-0" style={{ transformPerspective: 600, rotateY: spin, rotate: lean, y: hop, scaleY: squash, scaleX: stretch, originY: 1 }}>
          <Layers bot={bot} eye={{ x, y, scaleY: lid, opacity: eyes }}>
            <motion.svg aria-hidden viewBox="0 0 784 954" className="happy-eyes absolute inset-0 size-full" style={{ opacity: smile, filter: `drop-shadow(0 0 10px ${bot.color})` }}>
              {SMILE.map((s) => (
                <motion.g key={s.d} className="origin-center [transform-box:fill-box]" style={{ scale: pop }}>
                  <path d={s.d} transform={`rotate(6.5 ${s.cx} ${s.cy})`} style={{ stroke: `color-mix(in srgb, ${bot.color} 60%, white)` }} />
                </motion.g>
              ))}
            </motion.svg>
          </Layers>
        </motion.div>
      </div>
    </div>
  );
}
