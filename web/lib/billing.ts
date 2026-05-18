import { apiPost } from "./api";

export async function createCheckoutSession(success_url: string, cancel_url: string) {
  return apiPost<{ url: string }>("/billing/checkout", { success_url, cancel_url });
}

export async function createPortalSession(return_url: string) {
  return apiPost<{ url: string }>("/billing/portal", { return_url });
}
