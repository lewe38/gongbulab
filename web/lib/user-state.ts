/**
 * Helpers pour récupérer l'état d'apprentissage de l'utilisateur courant.
 * Utilisé par le dashboard pour afficher des données réelles plutôt que des placeholders.
 */
import { createSupabaseServerClient } from "./supabase/server";

export type UserState = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  current_level: 1 | 2 | 3 | 4;
  plan: "free" | "premium";
  // SRS stats
  due_cards_count: number;
  total_cards_count: number;
  // Streak (jours distincts avec une review SRS)
  streak_days: number;
  reviews_today: number;
  // Profile created_at, useful for "welcome" vs returning user
  created_at: string;
};

export async function getCurrentUserState(): Promise<UserState | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, plan, created_at")
    .eq("user_id", user.id)
    .single();

  // SRS counts
  const nowIso = new Date().toISOString();
  const [{ count: dueCount }, { count: totalCount }] = await Promise.all([
    supabase
      .from("srs_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("due_at", nowIso),
    supabase
      .from("srs_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  // Streak : on récupère les jours distincts où l'user a fait au moins 1 review,
  // sur les 90 derniers jours. Streak = nb de jours consécutifs en partant d'aujourd'hui.
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const { data: reviewDays } = await supabase
    .from("srs_reviews")
    .select("reviewed_at")
    .eq("user_id", user.id)
    .gte("reviewed_at", since.toISOString());

  const daySet = new Set(
    (reviewDays ?? []).map((r) => r.reviewed_at.slice(0, 10)), // YYYY-MM-DD
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daySet.has(key)) streak++;
    else break;
  }
  const todayKey = today.toISOString().slice(0, 10);
  const reviewsToday = (reviewDays ?? []).filter((r) =>
    r.reviewed_at.startsWith(todayKey),
  ).length;

  return {
    user_id: user.id,
    email: user.email ?? null,
    display_name: profile?.display_name ?? null,
    current_level: (profile?.current_level ?? 1) as 1 | 2 | 3 | 4,
    plan: (profile?.plan ?? "free") as "free" | "premium",
    due_cards_count: dueCount ?? 0,
    total_cards_count: totalCount ?? 0,
    streak_days: streak,
    reviews_today: reviewsToday,
    created_at: profile?.created_at ?? user.created_at,
  };
}
