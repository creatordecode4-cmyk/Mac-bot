"use client";

import { Children, isValidElement, memo, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlight } from "sugar-high";
import { Check, Copy } from "lucide-react";

const ALIAS: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", ts: "typescript", tsx: "typescript", py: "python",
  sh: "shell", bash: "shell", zsh: "shell", console: "shell", yml: "yaml", md: "markdown", xml: "html",
  "c++": "cpp", cs: "csharp", rb: "ruby", kt: "kotlin", rs: "rust", ps1: "powershell", gql: "graphql", text: "plaintext", txt: "plaintext",
};

function CodeBlock({ lang, code }: { lang?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => highlight(code, { lang: (lang && (ALIAS[lang] ?? lang)) as never }), [code, lang]);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="code overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a13]">
      <div className="flex items-center justify-between border-b border-white/[.06] bg-white/[.02] py-1.5 pl-4 pr-2 text-xs text-muted">
        <span className="font-mono">{lang ?? "code"}</span>
        <button onClick={copy} className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/[.06] hover:text-pearl">
          {copied ? <Check size={14} className="text-cyan" /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}

const components: Components = {
  pre({ children }) {
    const code = Children.toArray(children)[0];
    if (!isValidElement<{ className?: string; children?: ReactNode }>(code)) return <pre>{children}</pre>;
    const lang = /language-([\w+#-]+)/.exec(code.props.className ?? "")?.[1]?.toLowerCase();
    return <CodeBlock lang={lang} code={String(code.props.children ?? "").replace(/\n$/, "")} />;
  },
  a: ({ node: _, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};
const plugins = [remarkGfm];

// While a reply is still typing, close a half-written **bold** or `code` so raw symbols don't flash.
const closeOpen = (t: string) => {
  if (/[`*]$/.test(t)) return t;
  const outsideFences = t.split("```").filter((_, i) => i % 2 === 0).join("");
  if ((outsideFences.match(/`/g)?.length ?? 0) % 2) t += "`";
  else if ((outsideFences.match(/\*\*/g)?.length ?? 0) % 2) t += "**";
  return t;
};

function Markdown({ text, typing = false }: { text: string; typing?: boolean }) {
  return (
    <div className={`md ${typing ? "typing" : ""}`}>
      <ReactMarkdown remarkPlugins={plugins} components={components}>
        {typing ? closeOpen(text) : text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(Markdown);
