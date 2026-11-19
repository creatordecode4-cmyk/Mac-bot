import Link from "next/link";
import { ArrowRight, Blocks, Bot, Brain, Briefcase, Globe, ImagePlus, Mic, ShieldCheck, Smartphone, Sparkles, Zap } from "lucide-react";
import DemoChat from "@/components/DemoChat";
import Mascot from "@/components/Mascot";
import { InstallButton } from "@/components/Pwa";
import { APPS } from "@/lib/apps";
import { LANGUAGES } from "@/lib/languages";

const LANGS = `${Math.floor(LANGUAGES.length / 10) * 10}+`;

const FEATURES = [
  { Icon: Globe, title: `Speaks ${LANGS} languages`, text: "Write in any language and it answers in yours, or pick one and it sticks to it. Right-to-left scripts included." },
  { Icon: Blocks, title: "Opens your apps", text: "Ask it to message, email, schedule or navigate. It writes it, then opens WhatsApp, Mail, Calendar or Maps in one tap." },
  { Icon: Mic, title: "Speak & listen", text: "Talk in your language and hear any reply read aloud." },
  { Icon: Bot, title: "A bot for every job", text: "Mentor, English Coach, Chef, Tutor and more. Or create and share your own." },
  { Icon: ImagePlus, title: "Sees your images", text: "Snap a receipt, a chart or a bug, and just ask about it." },
  { Icon: Zap, title: "Replies that stream", text: "Answers type out live. No staring at a spinner." },
  { Icon: ShieldCheck, title: "Private by design", text: "No account needed. Your chat history lives only on your device." },
  { Icon: Smartphone, title: "Installs like an app", text: "Add it to your home screen. Full-screen, fast, on any phone." },
];

const MODES = [
  { Icon: Zap, name: "Fast", text: "Quick, sharp answers when you just need the point." },
  { Icon: Brain, name: "Think Deeper", text: "Breaks hard problems into steps and checks its work." },
  { Icon: Briefcase, name: "Business Mentor", text: "Thinks like a founder: first principles, 10x thinking, real numbers in your currency." },
];

const HELLOS = [
  "Hello", "Hola", "Bonjour", "Hallo", "Ciao", "Olá", "Привет", "مرحبا", "नमस्ते", "你好", "こんにちは", "안녕하세요", "Merhaba", "Xin chào",
  "สวัสดี", "Jambo", "שלום", "Hej", "Γειά σου", "Cześć", "Halo", "Sawubona", "Kumusta", "নমস্কার", "سلام", "Kia ora", "Szia", "Ahoj", "வணக்கம்", "ሰላም",
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-gradient inline-block text-xs font-semibold uppercase tracking-[.2em]">{children}</p>;
}

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <nav className="sticky top-0 z-20 border-b border-white/[.06] bg-night/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link href="/" className="flex items-center gap-2 text-[17px] font-semibold tracking-tight">
            <img src="/mascot.webp" alt="" className="h-8 w-auto" />
            MAC Bot
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <InstallButton className="btn-ghost hidden h-10 px-4 text-sm sm:inline-flex" />
            <Link href="/chat" className="btn-primary h-10 px-5 text-sm">
              Open app
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-20 pt-10 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pb-24 lg:pt-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/.035)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <p className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-pearl/90">
            <Sparkles size={14} className="text-iris-indigo" /> Free to start · {LANGS} languages · Opens your apps
          </p>
          <h1 className="mt-6 text-[clamp(2.75rem,10vw,5.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
            Your smartest
            <br />
            <span className="text-gradient">little friend.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-[17px] leading-relaxed text-muted lg:mx-0 lg:text-lg">
            MAC Bot is a premium AI assistant that speaks your language, thinks like a founder and opens your apps — WhatsApp, Mail, Calendar, Maps and more.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/chat" className="btn-primary w-full sm:w-auto">
              Start chatting <ArrowRight size={18} />
            </Link>
            <a href="#demo" className="btn-ghost w-full sm:w-auto">
              See it in action
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">No signup · Works on any phone · Chats stay on your device</p>
        </div>
        <div className="relative order-1 flex justify-center pb-6 lg:order-2">
          <div aria-hidden className="absolute left-1/2 top-1/2 size-[min(80vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/.11),rgb(188_191_255/.05)_60%,transparent)]" />
          <Mascot className="w-[min(52vw,230px)] sm:w-64 lg:w-[340px]" />
        </div>
      </section>

      {/* "Hello" in many languages */}
      <section aria-label={`Fluent in ${LANGS} languages`} className="pb-24 lg:pb-32">
        <p className="text-center text-xs font-semibold uppercase tracking-[.2em] text-muted">Fluent in {LANGS} languages</p>
        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <div aria-hidden className="animate-marquee flex w-max gap-10 pr-10 text-2xl font-medium tracking-tight text-pearl/70 sm:text-3xl">
            {[...HELLOS, ...HELLOS].map((h, i) => (
              <span key={i} className={i % 3 ? "" : "text-gradient"}>
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 pb-24 lg:pb-32">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Why MAC Bot</Eyebrow>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Small bot. <span className="text-gradient">Big brain.</span>
          </h2>
          <p className="mt-4 text-muted">Everything you want from a premium AI assistant — free to start, fluent in your language, wherever you are.</p>
        </div>
        <div className="mt-12 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, text }) => (
            <div key={title} className="glass group relative flex gap-4 overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20 sm:block sm:p-6">
              <div aria-hidden className="absolute -right-10 -top-10 size-32 rounded-full bg-iris-indigo/15 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-pearl shadow-[inset_0_1px_0_rgb(255_255_255/.1)]">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight sm:mt-5">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted sm:mt-2">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-sm text-muted">Opens with everything filled in, ready for you to send:</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {Object.values(APPS).map(({ label, Icon }) => (
              <span key={label} className="glass flex h-9 items-center gap-2 rounded-full px-3.5 text-sm text-pearl/85">
                <Icon size={15} /> {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section id="demo" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-12 px-5 pb-24 lg:grid-cols-2 lg:gap-16 lg:pb-32">
        <div>
          <Eyebrow>Live preview</Eyebrow>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Any language.
            <br />
            <span className="text-gradient">Real results.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted">Pick a mode for the moment — MAC Bot changes how it thinks, not just what it says.</p>
          <div className="mt-8 space-y-3">
            {MODES.map(({ Icon, name, text }) => (
              <div key={name} className="glass flex items-start gap-4 rounded-2xl p-4">
                <div className="bg-brand grid size-9 shrink-0 place-items-center rounded-xl text-night">
                  <Icon size={17} />
                </div>
                <div>
                  <p className="font-semibold">{name}</p>
                  <p className="mt-0.5 text-sm text-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DemoChat />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="glass relative overflow-hidden rounded-[32px] px-6 py-14 text-center sm:px-12">
          <div aria-hidden className="absolute -bottom-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-iris-indigo/20 blur-3xl" />
          <div aria-hidden className="absolute -top-24 left-1/3 h-40 w-1/2 rounded-full bg-iris-rose/15 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            Your new favourite friend
            <br className="hidden sm:block" /> is one tap away.
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-muted">Free to start. No signup. Install it on your phone in seconds.</p>
          <Link href="/chat" className="btn-primary relative mt-8">
            Start chatting <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2 text-pearl">
            <img src="/mascot.webp" alt="" className="h-6 w-auto" />
            <span className="font-semibold">MAC Bot</span>
            <span className="text-muted">· Your smartest little friend.</span>
          </div>
          <div className="flex gap-5 sm:ml-auto">
            <a href="#features" className="hover:text-pearl">Features</a>
            <a href="#demo" className="hover:text-pearl">Demo</a>
            <Link href="/chat" className="hover:text-pearl">Chat</Link>
          </div>
          <p className="sm:ml-6">Made for curious minds everywhere 🌍 · © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
