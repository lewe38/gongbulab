/**
 * Helpers SRS pour les pages /vocab :
 * - getSrsOverview : stats + récents ajouts pour la page index
 * - getDueCards : queue de review pour la page /vocab/review
 *
 * Tout côté serveur (RSC ou Server Action).
 */
import { createSupabaseServerClient } from "./supabase/server";
import type { Locale } from "./lessons";

export type SrsState = "new" | "learning" | "review" | "relearning";

export type SrsOverview = {
  total: number;
  due_now: number;
  by_state: Record<SrsState, number>;
  recently_added: RecentCard[];
};

export type RecentCard = {
  card_id: number;
  hangeul: string;
  translation: string | null;
  state: SrsState;
};

export type DueCard = {
  card_id: number;
  word_id: number;
  hangeul: string;
  romanization: string | null;
  translation: string | null;
  part_of_speech: string | null;
  state: SrsState;
};

export async function getSrsOverview(locale: Locale = "fr"): Promise<SrsOverview | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();

  const [totalRes, dueRes, byStateRes, recentRes] = await Promise.all([
    supabase
      .from("srs_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("srs_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("due_at", nowIso),
    supabase.from("srs_cards").select("state").eq("user_id", user.id),
    supabase
      .from("srs_cards")
      .select(
        `id, state, words ( hangeul, word_translations ( locale, translation ) )`,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const by_state: Record<SrsState, number> = {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
  };
  for (const r of byStateRes.data ?? []) {
    by_state[r.state as SrsState] = (by_state[r.state as SrsState] ?? 0) + 1;
  }

  const recently_added: RecentCard[] = (recentRes.data ?? []).map((r) => ({
    card_id: r.id,
    hangeul: r.words.hangeul,
    translation:
      r.words.word_translations.find((t) => t.locale === locale)?.translation ?? null,
    state: r.state as SrsState,
  }));

  return {
    total: totalRes.count ?? 0,
    due_now: dueRes.count ?? 0,
    by_state,
    recently_added,
  };
}

export async function getDueCardsForReview(
  locale: Locale = "fr",
  limit = 50,
): Promise<DueCard[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("srs_cards")
    .select(
      `id, state, words ( id, hangeul, romanization, part_of_speech,
       word_translations ( locale, translation ) )`,
    )
    .eq("user_id", user.id)
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((r) => ({
    card_id: r.id,
    word_id: r.words.id,
    hangeul: r.words.hangeul,
    romanization: r.words.romanization,
    translation:
      r.words.word_translations.find((t) => t.locale === locale)?.translation ?? null,
    part_of_speech: r.words.part_of_speech,
    state: r.state as SrsState,
  }));
}
