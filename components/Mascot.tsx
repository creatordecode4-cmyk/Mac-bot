"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useSpring } from "framer-motion";

// The eyes are separate layers cut from /public/bot.png so they can look around and blink.
// Positions are % of the mascot box (784×954 px in the source image).
const EYES = [
  { src: "/mascot-eye-l.webp", left: "2.42%", top: "39.83%" },
  { src: "/mascot-eye-r.webp", left: "43.24%", top: "43.61%" },
];

export default function Mascot({ className = "" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const spring = { stiffness: 140, damping: 15, mass: 0.5 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const tilt = useSpring(0, spring);
  const lid = useMotionValue(1);

  useEffect(() => {
    const look = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.58);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / (r.width * 1.2)); // look harder the farther away the pointer is
      x.set((dx / d) * k * r.width * 0.04);
      y.set((dy / d) * k * r.width * 0.03);
      tilt.set((dx / d) * k * 5);
    };
    let timer = 0;
    const blink = () => {
      animate(lid, [1, 0.08, 1], { duration: 0.22, ease: "easeInOut" });
      timer = window.setTimeout(blink, 2200 + Math.random() * 3800);
    };
    timer = window.setTimeout(blink, 1500);
    window.addEventListener("pointermove", look, { passive: true });
    window.addEventListener("pointerdown", look, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", look);
      window.removeEventListener("pointerdown", look);
    };
  }, [x, y, tilt, lid]);

  return (
    <div ref={box} className={`relative aspect-[784/954] select-none ${className}`}>
      <div aria-hidden className="mascot-glow animate-shadow absolute -bottom-[6%] left-[15%] h-[11%] w-[70%] rounded-[50%]" />
      <div className="animate-float absolute inset-0">
        <motion.div className="absolute inset-0" style={{ rotate: tilt }}>
          <img src="/mascot-body.webp" alt="MAC Bot, a glowing round robot" draggable={false} className="absolute inset-0 size-full" />
          {EYES.map((eye) => (
            <motion.img
              key={eye.src}
              src={eye.src}
              alt=""
              draggable={false}
              className="absolute aspect-square w-[38.52%] mix-blend-plus-lighter"
              style={{ left: eye.left, top: eye.top, x, y, scaleY: lid }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
