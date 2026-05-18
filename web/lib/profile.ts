import { apiGet, apiPatch } from "./api";

export type Profile = {
  user_id: string;
  display_name: string | null;
  interface_lang: string;
  plan: "free" | "premium";
  current_level: number;
  created_at: string;
  updated_at: string;
};

export type ProfilePatch = Partial<
  Pick<Profile, "display_name" | "interface_lang" | "current_level">
>;

export async function getProfile() {
  return apiGet<Profile>("/profile");
}

export async function updateProfile(patch: ProfilePatch) {
  return apiPatch<Profile>("/profile", patch);
}
