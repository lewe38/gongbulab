/**
 * Helpers d'accès aux données pédagogiques (lessons, grammar, examples, words).
 * Tous côté serveur (RSC) — à appeler dans des Server Components ou route handlers.
 */
import { createSupabaseServerClient } from "./supabase/server";
import type { Database } from "./db.types";

export type Locale = "fr" | "en";
type Tables = Database["public"]["Tables"];

// ─── Chapter (= 1과) ────────────────────────────────────────────────
// Notre table `lessons` stocke (level, unit_number, section_number). Un chapitre
// est la projection distincte sur (level, unit_number).

export type Chapter = {
  level: number;
  chapter_number: number; // = unit_number en DB
  title_ko: string;
  title_translated: string;
  intent: string | null;
  sections_count: number;
  grammar_count: number;
};

export type ChaptersByLevel = Record<number, Chapter[]>;

export async function getChaptersByLevel(locale: Locale = "fr"): Promise<ChaptersByLevel> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
      id,
      level,
      unit_number,
      section_number,
      title_ko,
      lesson_translations!inner ( locale, title, intent ),
      grammar_points ( id )
    `,
    )
    .eq("lesson_translations.locale", locale)
    .order("level")
    .order("unit_number")
    .order("section_number");

  if (error) throw error;

  // Strip le préfixe "<N>" / "<N> " que l'extraction met devant chaque title
  // (vient du marqueur de section dans le PDF source).
  const cleanTitle = (t: string) => t.replace(/^<\d+>\s*/, "").trim();

  // Groupe par (level, unit_number)
  const byKey = new Map<string, Chapter>();
  for (const row of data ?? []) {
    const key = `${row.level}-${row.unit_number}`;
    const tr = row.lesson_translations[0];
    const grammarN = row.grammar_points?.length ?? 0;
    const existing = byKey.get(key);
    if (existing) {
      existing.sections_count += 1;
      existing.grammar_count += grammarN;
    } else {
      byKey.set(key, {
        level: row.level,
        chapter_number: row.unit_number,
        title_ko: cleanTitle(row.title_ko),
        title_translated: cleanTitle(tr?.title ?? row.title_ko),
        intent: tr?.intent ?? null,
        sections_count: 1,
        grammar_count: grammarN,
      });
    }
  }

  const byLevel: ChaptersByLevel = {};
  for (const chapter of byKey.values()) {
    (byLevel[chapter.level] ??= []).push(chapter);
  }
  return byLevel;
}

// ─── Section (= une row de `lessons` en DB) ─────────────────────────

export type Section = Tables["lessons"]["Row"] & {
  title_translated: string | null;
  dialogue_translated: string | null;
};

export async function getSectionsByChapter(
  level: number,
  chapter: number,
  locale: Locale = "fr",
): Promise<Section[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(`*, lesson_translations!inner ( locale, title, dialogue )`)
    .eq("level", level)
    .eq("unit_number", chapter)
    .eq("lesson_translations.locale", locale)
    .order("section_number");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    title_translated: row.lesson_translations[0]?.title ?? null,
    dialogue_translated: row.lesson_translations[0]?.dialogue ?? null,
  }));
}

// ─── GrammarPoint + examples ────────────────────────────────────────

export type GrammarPointFull = Tables["grammar_points"]["Row"] & {
  summary: string | null;
  explanation: string | null;
  notes: string | null;
  examples: (Tables["examples"]["Row"] & { translation: string | null })[];
};

export async function getGrammarPointsForSection(
  lessonId: number,
  locale: Locale = "fr",
): Promise<GrammarPointFull[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("grammar_points")
    .select(
      `
      *,
      grammar_translations ( locale, summary, explanation, notes ),
      examples (
        *,
        example_translations ( locale, translation )
      )
    `,
    )
    .eq("lesson_id", lessonId)
    .order("order_in_lesson");

  if (error) throw error;

  return (data ?? []).map((gp) => {
    const tr = gp.grammar_translations.find((t) => t.locale === locale);
    return {
      ...gp,
      summary: tr?.summary ?? null,
      explanation: tr?.explanation ?? null,
      notes: tr?.notes ?? null,
      examples: gp.examples
        .sort((a, b) => a.order_in_point - b.order_in_point)
        .map((ex) => {
          const exTr = ex.example_translations.find((t) => t.locale === locale);
          return {
            ...ex,
            translation: exTr?.translation ?? null,
          };
        }),
    };
  });
}

// ─── Words ──────────────────────────────────────────────────────────

export type WordWithTranslation = Tables["words"]["Row"] & {
  translation: string | null;
};

export async function getWordsForSection(
  lessonId: number,
  locale: Locale = "fr",
): Promise<WordWithTranslation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("words")
    .select(`*, word_translations ( locale, translation )`)
    .eq("source_lesson_id", lessonId);
  if (error) throw error;
  return (data ?? []).map((w) => ({
    ...w,
    translation: w.word_translations.find((t) => t.locale === locale)?.translation ?? null,
  }));
}

// ─── Aggregate counts (for dashboard / lesson cards) ─────────────────

export async function getContentStats(): Promise<{
  chapters: number;
  sections: number;
  grammar_points: number;
  words: number;
}> {
  const supabase = await createSupabaseServerClient();
  const [sectionsRes, gpRes, wordsRes, chaptersRes] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("grammar_points").select("id", { count: "exact", head: true }),
    supabase.from("words").select("id", { count: "exact", head: true }),
    supabase.from("lessons").select("level, unit_number"),
  ]);

  const distinctChapters = new Set(
    (chaptersRes.data ?? []).map((r) => `${r.level}-${r.unit_number}`),
  );

  return {
    chapters: distinctChapters.size,
    sections: sectionsRes.count ?? 0,
    grammar_points: gpRes.count ?? 0,
    words: wordsRes.count ?? 0,
  };
}
