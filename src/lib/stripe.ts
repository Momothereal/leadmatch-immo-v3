import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export const STRIPE_PRICES = {
  starter_monthly: "price_1TTeMHJ8qNxQbhjwlNA6dNUx", // 49€/mois
  pro_monthly: "price_1TTeMhJ8qNxQbhjw5OzN1jHi", // 89€/mois
  pro_yearly: "price_1TTvntJ8qNxQbhjwn1DG4sxT", // 961,20€/an (-10%)
} as const;

/** Extrait un message d'erreur lisible depuis une erreur d'edge function. */
async function extractFunctionError(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) return mapStripeError(String(body.error));
    } catch {
      try {
        const text = await error.context.text();
        if (text) return mapStripeError(text);
      } catch {
        /* ignore */
      }
    }
    return fallback;
  }
  if (error instanceof Error) return mapStripeError(error.message);
  return fallback;
}

/** Traduit les erreurs techniques Stripe/Supabase en messages utilisateur. */
function mapStripeError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("no authorization") || m.includes("not authenticated")) {
    return "Vous devez être connecté pour souscrire. Reconnectez-vous puis réessayez.";
  }
  if (m.includes("stripe_secret_key")) {
    return "Le paiement n'est pas encore configuré côté serveur. Contactez le support.";
  }
  if (m.includes("priceid") || m.includes("no such price")) {
    return "Cette offre est indisponible. Merci de rafraîchir la page et réessayer.";
  }
  if (m.includes("rate limit")) {
    return "Trop de tentatives. Patientez quelques secondes puis réessayez.";
  }
  if (m.includes("failed to fetch") || m.includes("networkerror")) {
    return "Connexion au service de paiement impossible. Vérifiez votre réseau.";
  }
  return msg;
}

export async function startCheckout(priceId: string) {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId },
  });
  if (error) {
    const msg = await extractFunctionError(
      error,
      "Impossible d'ouvrir le checkout Stripe. Réessayez dans un instant.",
    );
    throw new Error(msg);
  }
  if (data?.error) throw new Error(mapStripeError(String(data.error)));
  if (!data?.url) {
    throw new Error("Réponse invalide du service de paiement (URL manquante).");
  }
  const win = window.open(data.url, "_blank");
  if (!win) {
    throw new Error(
      "La fenêtre de paiement a été bloquée par votre navigateur. Autorisez les pop-ups puis réessayez.",
    );
  }
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) {
    const msg = await extractFunctionError(
      error,
      "Impossible d'ouvrir le portail de gestion d'abonnement.",
    );
    throw new Error(msg);
  }
  if (data?.error) throw new Error(mapStripeError(String(data.error)));
  if (!data?.url) throw new Error("Portail client indisponible.");
  const win = window.open(data.url, "_blank");
  if (!win) {
    throw new Error(
      "La fenêtre a été bloquée par votre navigateur. Autorisez les pop-ups puis réessayez.",
    );
  }
}