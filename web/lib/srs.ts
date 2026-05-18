/**
 * Helpers typés pour les endpoints /srs/* de l'API FastAPI.
 * À utiliser en RSC ou Server Actions — pour le client, faire un wrapper séparé.
 */
import { apiGet, apiPost } from "./api";

export type DueCard = {
  card_id: number;
  word_id: number;
  hangeul: string;
  romanization: string | null;
  translation: string | null;
  part_of_speech: string | null;
  state: "new" | "learning" | "review" | "relearning";
  due_at: string;
};

export type SrsRating = "again" | "hard" | "good" | "easy";

export type ReviewResult = {
  card_id: number;
  new_state: string;
  new_due_at: string;
  new_stability: number;
  new_difficulty: number;
};

export async function getDueCards(locale: "fr" | "en" = "fr", limit = 50) {
  return apiGet<DueCard[]>(`/srs/due?locale=${locale}&limit=${limit}`);
}

export async function reviewCard(
  card_id: number,
  rating: SrsRating,
  time_taken_ms?: number,
) {
  return apiPost<ReviewResult>("/srs/review", { card_id, rating, time_taken_ms });
}

export async function enrollWord(word_id: number) {
  return apiPost<{ card_id: number | null; created: boolean }>(
    `/srs/enroll/${word_id}`,
    undefined,
  );
}
