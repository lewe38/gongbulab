"use server";

/**
 * Server Action pour valider une review SRS. Délègue à notre API FastAPI
 * (qui fait le calcul FSRS v6 atomiquement avec un update + insert log).
 */
import { apiPost, ApiError } from "./api";

export type ReviewState =
  | { ok: true; new_due_at: string; new_state: string }
  | { ok: false; error: string };

export async function submitReviewAction(
  _: ReviewState | null,
  formData: FormData,
): Promise<ReviewState> {
  const card_id = Number(formData.get("card_id"));
  const rating = formData.get("rating") as "again" | "hard" | "good" | "easy";
  const time_taken_ms = Number(formData.get("time_taken_ms") || 0) || undefined;

  if (!Number.isFinite(card_id) || !rating) {
    return { ok: false, error: "Paramètres invalides" };
  }

  try {
    const res = await apiPost<{
      card_id: number;
      new_state: string;
      new_due_at: string;
      new_stability: number;
      new_difficulty: number;
    }>("/srs/review", { card_id, rating, time_taken_ms });
    return { ok: true, new_due_at: res.new_due_at, new_state: res.new_state };
  } catch (e) {
    if (e instanceof ApiError) {
      return { ok: false, error: `API ${e.status} : ${JSON.stringify(e.detail)}` };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
