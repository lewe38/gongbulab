/**
 * Helpers pour la page détail d'un chapitre/section.
 * Récupère les sections d'un chapitre + leurs grammar points + exemples + vocab.
 */
import { createSupabaseServerClient } from "./supabase/server";
import type { Locale } from "./lessons";

const stripMarker = (t: string) => t.replace(/^<\d+>\s*/, "").trim();

export type ChapterDetail = {
  level: number;
  chapter_number: number;
  sections: SectionDetail[];
};

export type SectionDetail = {
  id: number;
  section_number: number;
  title_ko: string;
  title_translated: string | null;
  intent: string | null;
  dialogue_ko: string | null;
  dialogue_translated: string | null;
  grammar_points: GrammarDetail[];
  vocab: VocabDetail[];
};

export type GrammarDetail = {
  id: number;
  order_in_lesson: number;
  title_ko: string;
  title_translit: string | null;
  form_notes: string | null;
  summary: string | null;
  explanation: string | null;
  notes: string | null;
  examples: ExampleDetail[];
};

export type ExampleDetail = {
  id: number;
  korean: string;
  romanization: string | null;
  translation: string | null;
};

export type VocabDetail = {
  hangeul: string;
  translation: string | null;
  part_of_speech: string | null;
};

export async function getChapterDetail(
  level: number,
  chapter: number,
  locale: Locale = "fr",
): Promise<ChapterDetail | null> {
  const supabase = await createSupabaseServerClient();

  // 1. Sections du chapitre + leurs traductions (KO + FR, le dialogue_ko vit en lesson_translations.dialogue locale='ko')
  const { data: sections, error: secErr } = await supabase
    .from("lessons")
    .select(
      `id, section_number, title_ko,
       lesson_translations ( locale, title, dialogue, intent )`,
    )
    .eq("level", level)
    .eq("unit_number", chapter)
    .order("section_number");

  if (secErr) throw secErr;
  if (!sections || sections.length === 0) return null;

  const sectionIds = sections.map((s) => s.id);

  // 2. Grammar points + leurs traductions + exemples + traductions des exemples
  const { data: gps, error: gpErr } = await supabase
    .from("grammar_points")
    .select(
      `id, lesson_id, order_in_lesson, title_ko, title_translit, form_notes,
       grammar_translations ( locale, summary, explanation, notes ),
       examples (
         id, korean, romanization, order_in_point,
         example_translations ( locale, translation )
       )`,
    )
    .in("lesson_id", sectionIds)
    .order("order_in_lesson");

  if (gpErr) throw gpErr;

  // 3. Vocab par section
  const { data: words, error: wErr } = await supabase
    .from("words")
    .select(
      `hangeul, part_of_speech, source_lesson_id,
       word_translations ( locale, translation )`,
    )
    .in("source_lesson_id", sectionIds);

  if (wErr) throw wErr;

  // Indexation
  const gpsBySection = new Map<number, GrammarDetail[]>();
  for (const gp of gps ?? []) {
    const tr = gp.grammar_translations.find((t) => t.locale === locale);
    const detail: GrammarDetail = {
      id: gp.id,
      order_in_lesson: gp.order_in_lesson,
      title_ko: gp.title_ko,
      title_translit: gp.title_translit,
      form_notes: gp.form_notes,
      summary: tr?.summary ?? null,
      explanation: tr?.explanation ?? null,
      notes: tr?.notes ?? null,
      examples: (gp.examples ?? [])
        .sort((a, b) => a.order_in_point - b.order_in_point)
        .map((ex) => ({
          id: ex.id,
          korean: ex.korean,
          romanization: ex.romanization,
          translation:
            ex.example_translations.find((t) => t.locale === locale)?.translation ?? null,
        })),
    };
    (gpsBySection.get(gp.lesson_id) ?? gpsBySection.set(gp.lesson_id, []).get(gp.lesson_id)!).push(
      detail,
    );
  }

  const vocabBySection = new Map<number, VocabDetail[]>();
  for (const w of words ?? []) {
    if (!w.source_lesson_id) continue;
    const entry: VocabDetail = {
      hangeul: w.hangeul,
      translation: w.word_translations.find((t) => t.locale === locale)?.translation ?? null,
      part_of_speech: w.part_of_speech,
    };
    (
      vocabBySection.get(w.source_lesson_id) ??
      vocabBySection.set(w.source_lesson_id, []).get(w.source_lesson_id)!
    ).push(entry);
  }

  const sectionsOut: SectionDetail[] = sections.map((s) => {
    const tr = s.lesson_translations.find((t) => t.locale === locale);
    const trKo = s.lesson_translations.find((t) => t.locale === "ko");
    return {
      id: s.id,
      section_number: s.section_number,
      title_ko: stripMarker(s.title_ko),
      title_translated: tr?.title ? stripMarker(tr.title) : null,
      intent: tr?.intent ?? null,
      dialogue_ko: trKo?.dialogue ?? null,
      dialogue_translated: tr?.dialogue ?? null,
      grammar_points: gpsBySection.get(s.id) ?? [],
      vocab: vocabBySection.get(s.id) ?? [],
    };
  });

  return { level, chapter_number: chapter, sections: sectionsOut };
}
