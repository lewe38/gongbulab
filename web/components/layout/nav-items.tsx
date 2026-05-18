import {
  House,
  BookOpenText,
  Cards,
  ChatCircleDots,
  UserCircle,
} from "@/components/ui/icons";

export type NavItem = {
  href: string;
  labelKey: "dashboard" | "lessons" | "srs" | "chat" | "profile";
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

// Ordre = ordre d'affichage dans sidebar et bottom nav
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", Icon: House },
  { href: "/lessons", labelKey: "lessons", Icon: BookOpenText },
  { href: "/srs", labelKey: "srs", Icon: Cards },
  { href: "/chat", labelKey: "chat", Icon: ChatCircleDots },
  { href: "/profile", labelKey: "profile", Icon: UserCircle },
];
