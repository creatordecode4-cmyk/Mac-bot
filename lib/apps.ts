// "Access" to other apps. The AI writes [Label](app:NAME?key=value) (see APPS in lib/ai.ts);
// this turns it into a real link that opens the app with everything filled in. Nothing is sent until the user taps and confirms.

import { AtSign, AudioLines, Briefcase, CalendarPlus, Languages, Mail, MapPin, MessageCircle, MessageSquare, Navigation, Phone, Play, Search, Send, type LucideIcon } from "lucide-react";

type Query = Record<string, string>;
const enc = encodeURIComponent;
const phone = (s = "") => s.replace(/[^\d+]/g, "");
const emails = (s = "") =>
  s
    .split(/[\s,;]+/)
    .filter((e) => /^[^\s@?&#/:]+@[^\s@?&#/:]+\.[^\s@?&#/:]+$/.test(e))
    .join(",");

/** "20261123T1000" (or 2026-11-23 10:00, or just a date) → Google Calendar dates, ending 1 hour (or 1 day) later if no end. */
function dates(start = "", end = "") {
  const parse = (s: string) => {
    const d = s.replace(/\D/g, "");
    if (d.length < 8) return null;
    const [y, m, day, h, min] = [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8), d.slice(8, 10), d.slice(10, 12)].map(Number);
    return { at: new Date(Date.UTC(y, m - 1, day, h || 0, min || 0)), timed: d.length >= 12 };
  };
  const fmt = (t: Date, timed: boolean) => t.toISOString().replace(/[-:]/g, "").slice(0, timed ? 15 : 8);
  const a = parse(start);
  if (!a || isNaN(+a.at)) return "";
  const b = parse(end);
  const finish = b && !isNaN(+b.at) && b.at > a.at ? b.at : new Date(+a.at + (a.timed ? 3600e3 : 86400e3));
  return `&dates=${fmt(a.at, a.timed)}/${fmt(finish, a.timed)}`;
}

export const APPS: Record<string, { label: string; Icon: LucideIcon; url: (q: Query, tz: string) => string }> = {
  whatsapp: { label: "WhatsApp", Icon: MessageCircle, url: (q) => `https://wa.me/${(q.phone ?? "").replace(/\D/g, "")}?text=${enc(q.text ?? "")}` },
  telegram: { label: "Telegram", Icon: Send, url: (q) => `https://t.me/share/url?url=${enc(q.text ?? "")}` },
  email: { label: "Email", Icon: Mail, url: (q) => `mailto:${emails(q.to)}?subject=${enc(q.subject ?? "")}&body=${enc(q.body ?? q.text ?? "")}` },
  sms: { label: "Messages", Icon: MessageSquare, url: (q) => `sms:${phone(q.to)}?&body=${enc(q.body ?? q.text ?? "")}` },
  call: { label: "Phone", Icon: Phone, url: (q) => `tel:${phone(q.to)}` },
  calendar: {
    label: "Calendar",
    Icon: CalendarPlus,
    url: (q, tz) =>
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(q.title ?? "")}${dates(q.start, q.end)}&details=${enc(q.details ?? "")}&location=${enc(q.location ?? "")}&ctz=${enc(tz)}`,
  },
  maps: { label: "Maps", Icon: MapPin, url: (q) => `https://www.google.com/maps/search/?api=1&query=${enc(q.q ?? "")}` },
  directions: { label: "Directions", Icon: Navigation, url: (q) => `https://www.google.com/maps/dir/?api=1&destination=${enc(q.to ?? q.q ?? "")}` },
  youtube: { label: "YouTube", Icon: Play, url: (q) => `https://www.youtube.com/results?search_query=${enc(q.q ?? "")}` },
  spotify: { label: "Spotify", Icon: AudioLines, url: (q) => `https://open.spotify.com/search/${enc(q.q ?? "")}` },
  google: { label: "Google", Icon: Search, url: (q) => `https://www.google.com/search?q=${enc(q.q ?? "")}` },
  x: { label: "X", Icon: AtSign, url: (q) => `https://x.com/intent/tweet?text=${enc(q.text ?? "")}` },
  linkedin: { label: "LinkedIn", Icon: Briefcase, url: (q) => `https://www.linkedin.com/feed/?shareActive=true&text=${enc(q.text ?? "")}` },
  translate: { label: "Translate", Icon: Languages, url: (q) => `https://translate.google.com/?sl=auto&tl=${enc(q.to ?? "en")}&text=${enc(q.text ?? "")}&op=translate` },
};

/** app:whatsapp?text=Hi → the app plus a safe https/mailto/sms/tel link (every value is re-encoded into a fixed template). */
export function openApp(href: string, tz = "UTC") {
  const m = /^app:([a-z]+)\??(.*)$/i.exec(href);
  const app = m && APPS[m[1].toLowerCase()];
  if (!app) return null;
  const q: Query = {};
  for (const pair of m[2].split("&")) {
    const [k, ...v] = pair.split("=");
    if (!k) continue;
    try {
      q[k.toLowerCase()] = decodeURIComponent(v.join("="));
    } catch {
      q[k.toLowerCase()] = v.join("=");
    }
  }
  return { ...app, href: app.url(q, tz) };
}

/** Strip app action links (for copying or sharing a reply as plain text). */
export const withoutAppLinks = (md: string) => md.replace(/\n?\[[^\]\n]*\]\(app:[^)\n]*\)/g, "").trim();
