import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "gongbulab — révision de coréen",
  description:
    "Plateforme de révision du coréen : leçons de grammaire, SRS de vocabulaire, chatbot.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      {/* Anti-FOUC : on lit la pref dark mode (user > système) avant l'hydratation React */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(_){}})();`,
          }}
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
