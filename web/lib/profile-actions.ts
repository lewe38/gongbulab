"use server";

/**
 * Server Actions pour mettre à jour le profil utilisateur.
 * Connecte directement à Supabase via le client serveur (l'auth est gérée par les cookies).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { routing } from "@/i18n/routing";
import { createSupabaseServerClient } from "./supabase/server";

const patchSchema = z.object({
  display_name: z.string().max(60).optional(),
  interface_lang: z.enum(routing.locales).optional(),
  current_level: z.coerce.number().min(1).max(4).optional(),
});

export type ProfileState = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(
  _: ProfileState | null,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = patchSchema.safeParse({
    display_name: (formData.get("display_name") as string) || undefined,
    interface_lang: (formData.get("interface_lang") as string) || undefined,
    current_level: formData.get("current_level") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
