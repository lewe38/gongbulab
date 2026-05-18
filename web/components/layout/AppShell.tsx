import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";

/**
 * Layout principal de l'app authentifiée :
 * - sidebar gauche (desktop)
 * - topbar minimale (les deux)
 * - bottom nav (mobile)
 * - zone de contenu scrollable
 *
 * Padding bas ajouté en mobile pour ne pas être masqué par la bottom nav.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
