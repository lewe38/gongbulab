import {
  House,
  BookOpenText,
  Cards,
  ChatCircleDots,
  UserCircle,
} from "@/components/ui/icons";

export type NavItem = {
  href: string;
  labelKey: "dashboard" | "lessons" | "vocab" | "chatbot" | "profile";
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

// Routes en anglais (slug stable cross-locale), libellés via i18n.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", Icon: House },
  { href: "/lessons", labelKey: "lessons", Icon: BookOpenText },
  { href: "/vocab", labelKey: "vocab", Icon: Cards },
  { href: "/chatbot", labelKey: "chatbot", Icon: ChatCircleDots },
  { href: "/profile", labelKey: "profile", Icon: UserCircle },
];
