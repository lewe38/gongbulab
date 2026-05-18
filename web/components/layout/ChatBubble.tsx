"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ChatBubble as ChatBubbleIcon } from "@/components/ui/icons";

/**
 * Bulle flottante du chatbot — présente sur toutes les pages sauf /chatbot.
 * Pour l'instant simple Link vers la page chat. À transformer en panel slide
 * quand on aura le composant chat conversationnel inline.
 */
export function ChatBubble() {
  const tNav = useTranslations("nav");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  return (
    <Link
      href={`/${locale}/chatbot`}
      aria-label={tNav("chatbot")}
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:scale-105 transition-transform"
    >
      <ChatBubbleIcon size={22} />
    </Link>
  );
}
