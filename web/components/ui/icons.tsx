// Petites icônes SVG inline — pas de dep externe. Style outline, stroke-width 1.75.
//
// Conçu pour être consommé via la prop `size` (default 20) et `className` (couleur via currentColor).

type IconProps = { size?: number; className?: string };

const wrap = (children: React.ReactNode, { size = 20, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export function House(p: IconProps) {
  return wrap(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M10 21v-6h4v6" />
    </>,
    p,
  );
}

export function BookOpenText(p: IconProps) {
  return wrap(
    <>
      <path d="M12 7v14" />
      <path d="M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H3z" />
      <path d="M21 5a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h7z" />
      <path d="M6 8h3M6 12h3M15 8h3M15 12h3" />
    </>,
    p,
  );
}

export function Cards(p: IconProps) {
  return wrap(
    <>
      <rect x="6" y="4" width="14" height="16" rx="2" />
      <path d="M4 8v10a2 2 0 0 0 2 2h10" />
    </>,
    p,
  );
}

export function ChatCircleDots(p: IconProps) {
  return wrap(
    <>
      <path d="M21 12a9 9 0 1 1-3.7-7.3L21 4l-1 3.5A9 9 0 0 1 21 12Z" />
      <circle cx="8.5" cy="12" r="0.6" fill="currentColor" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
      <circle cx="15.5" cy="12" r="0.6" fill="currentColor" />
    </>,
    p,
  );
}

export function UserCircle(p: IconProps) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19a6 6 0 0 1 11 0" />
    </>,
    p,
  );
}

export function Sparkle(p: IconProps) {
  return wrap(
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" />
    </>,
    p,
  );
}

export function ChevronLeft(p: IconProps) {
  return wrap(<path d="m15 6-6 6 6 6" />, p);
}

export function ChevronRight(p: IconProps) {
  return wrap(<path d="m9 6 6 6-6 6" />, p);
}

export function ArrowRight(p: IconProps) {
  return wrap(<><path d="M5 12h14M13 5l7 7-7 7" /></>, p);
}

export function Play(p: IconProps) {
  return wrap(<path d="M8 5v14l11-7z" fill="currentColor" />, p);
}

export function Check(p: IconProps) {
  return wrap(<path d="M5 12l5 5L20 7" />, p);
}

export function Cross(p: IconProps) {
  return wrap(<><path d="M6 6l12 12M6 18L18 6" /></>, p);
}

export function Flame(p: IconProps) {
  return wrap(
    <path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4-1 5-3 5-3 8a5 5 0 0 0 10 0c0-5-3-7-5-13z" />,
    p,
  );
}

// Tige de bambou stylisée — utilisée comme marqueur du niveau actif (cf. DESIGN.md, métaphore turquoise).
export function Sprout(p: IconProps) {
  return wrap(
    <>
      <path d="M12 20v-7" />
      <path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5z" />
      <path d="M12 13c3 0 5-2 5-5-3 0-5 2-5 5z" />
    </>,
    p,
  );
}

export function ChatBubble(p: IconProps) {
  return wrap(
    <>
      <path d="M3 12c0-4.5 4-8 9-8s9 3.5 9 8-4 8-9 8c-1.5 0-3-.3-4.3-.9L3 21l1.4-4.5C3.5 15.3 3 13.7 3 12z" />
    </>,
    p,
  );
}
