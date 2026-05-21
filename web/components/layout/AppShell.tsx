import { createSupabaseServerClient } from "@/lib/supabase/server";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { ChatBubble } from "./ChatBubble";

/**
 * Layout principal de l'app authentifiée :
 * sidebar gauche (desktop) + topbar + bottom nav (mobile) + ChatBubble flottante.
 *
 * Récupère l'utilisateur courant côté serveur et le passe à la Topbar pour
 * afficher le menu utilisateur (signout).
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-bg text-text flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar userEmail={user?.email ?? null} />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <ChatBubble />
    </div>
  );
}
