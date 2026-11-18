import { buildRequest, DRAFT_PROMPT, isMode, MODES, providers, systemPrompt, type ApiMessage } from "@/lib/ai";
import { BOTS } from "@/lib/bots";

export const maxDuration = 60; // seconds — fits Vercel's free (Hobby) plan

const fail = (error: string, status: number) => Response.json({ error }, { status });

/** Map an upstream failure to a code the UI turns into a friendly message. */
function classify(status: number, body: string) {
  if (status === 429 || /quota|rate.?limit|resource.?exhausted/i.test(body)) return "rate_limit";
  if (status === 401 || status === 403 || /api.?key/i.test(body)) return "bad_key";
  if (status === 404) return "bad_model";
  if (status === 413) return "too_big";
  if (status >= 500) return "busy";
  return "error";
}

/** Turn the provider's SSE stream (OpenAI format) into plain text chunks. */
function textStream(body: ReadableStream<Uint8Array>) {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.trim();
          if (!data.startsWith("data:")) continue;
          const payload = data.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          let json;
          try {
            json = JSON.parse(payload);
          } catch {
            continue;
          }
          if (json.error) throw new Error(json.error.message ?? "Upstream error");
          const text = json.choices?.[0]?.delta?.content;
          if (text) controller.enqueue(encoder.encode(text));
        }
      },
    }),
  );
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  let history: ApiMessage[];
  let system: string;
  let temperature: number;

  if (body?.task === "draft") {
    // "Make it with AI" in the bot creator: one-line idea → bot instructions.
    const idea = str(body.idea, 300);
    if (!idea) return fail("bad_request", 400);
    history = [{ role: "user", content: `Bot name: ${str(body.name, 40) || "(not chosen yet)"}\nIdea: ${idea}` }];
    system = DRAFT_PROMPT;
    temperature = 0.8;
  } else {
    history = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m: ApiMessage) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
      .slice(-20) // memory: the last ~20 messages
      .map((m: ApiMessage) => ({
        role: m.role,
        content: m.content.slice(0, 12_000),
        image: typeof m.image === "string" && m.image.startsWith("data:image/") ? m.image : undefined,
      }));
    while (history[0]?.role === "assistant") history.shift();
    if (!history.length) return fail("bad_request", 400);
    const asked: unknown = body?.mode;
    const mode = isMode(asked) ? asked : "fast";
    // The selected bot's personality arrives with every request (custom bots live only in the browser).
    const bot = { name: str(body?.bot?.name, 60) || BOTS[0].name, prompt: str(body?.bot?.prompt, 4000) || BOTS[0].prompt };
    system = systemPrompt(bot, mode);
    temperature = MODES[mode].temperature;
  }

  let error = "no_key";
  for (const p of providers()) {
    if (!p.url || (!p.key && p.name !== "custom")) continue;
    try {
      const res = await fetch(`${p.url.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(p.key && { Authorization: `Bearer ${p.key}` }) },
        body: JSON.stringify(buildRequest(p, system, temperature, history)),
        signal: req.signal,
      });
      if (res.ok && res.body) {
        return new Response(textStream(res.body), {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Provider": p.name },
        });
      }
      const detail = await res.text();
      console.error(`[mac-bot] ${p.name} ${res.status}: ${detail.slice(0, 400)}`);
      if (error === "no_key") error = classify(res.status, detail);
    } catch (e) {
      if (req.signal.aborted) return new Response(null, { status: 499 });
      console.error(`[mac-bot] ${p.name} unreachable:`, e);
      if (error === "no_key") error = "network";
    }
  }
  return fail(error, error === "rate_limit" ? 429 : 502);
}
