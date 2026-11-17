import type { Metadata } from "next";
import Chat from "@/components/Chat";
import { providers } from "@/lib/ai";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  const [main] = providers();
  return <Chat vision={main.vision} provider={main.label} />;
}
