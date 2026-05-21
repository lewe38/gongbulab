"use server";

/**
 * Server Actions SRS — enroll les mots d'une section dans les révisions de l'utilisateur.
 * Va directement en DB (Supabase service-role pour bypass RLS) pour insert.
 */
import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "./supabase/server";

export type EnrollResult =
  | { ok: true; enrolled: number; already_known: number }
  | { ok: false; error: string };

export async function enrollSectionVocabAction(
  prev: EnrollResult | null,
  formData: FormData,
): Promise<EnrollResult> {
  const lessonId = Number(formData.get("lesson_id"));
  if (!Number.isFinite(lessonId)) return { ok: false, error: "lesson_id invalide" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Récupère tous les word_id de la section
  const { data: words, error: wErr } = await supabase
    .from("words")
    .select("id")
    .eq("source_lesson_id", lessonId);
  if (wErr) return { ok: false, error: wErr.message };
  if (!words || words.length === 0)
    return { ok: false, error: "Aucun mot lié à cette section." };

  // Insère les srs_cards avec on conflict do nothing (idempotent)
  const rows = words.map((w) => ({
    user_id: user.id,
    word_id: w.id,
    state: "new" as const,
  }));

  const { data: inserted, error: insErr } = await supabase
    .from("srs_cards")
    .upsert(rows, { onConflict: "user_id,word_id", ignoreDuplicates: true })
    .select("id");
  if (insErr) return { ok: false, error: insErr.message };

  const enrolled = inserted?.length ?? 0;
  const already_known = words.length - enrolled;

  revalidatePath("/", "layout");
  return { ok: true, enrolled, already_known };
}
