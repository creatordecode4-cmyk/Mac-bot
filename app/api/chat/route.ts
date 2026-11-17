import { buildRequest, isMode, providers, type ApiMessage } from "@/lib/ai";

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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const history: ApiMessage[] = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: ApiMessage) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .slice(-20) // memory: the last ~20 messages
    .map((m: ApiMessage) => ({
      role: m.role,
      content: m.content.slice(0, 12_000),
      image: typeof m.image === "string" && m.image.startsWith("data:image/") ? m.image : undefined,
    }));
  while (history[0]?.role === "assistant") history.shift();
  if (!history.length) return fail("bad_request", 400);
  const mode = isMode(body?.mode) ? body.mode : "fast";

  let error = "no_key";
  for (const p of providers()) {
    if (!p.url || (!p.key && p.name !== "custom")) continue;
    try {
      const res = await fetch(`${p.url.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(p.key && { Authorization: `Bearer ${p.key}` }) },
        body: JSON.stringify(buildRequest(p, mode, history)),
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
