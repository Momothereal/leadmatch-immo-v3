import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const log = (s: string, d?: unknown) =>
  console.log(`[stripe-webhook] ${s}${d ? ` ${JSON.stringify(d)}` : ""}`);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const body = await req.text();

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2025-08-27.basil",
  });

  // Vérifie la signature Stripe
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch (err) {
    log("Signature invalide", { err: String(err) });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  log("event received", { type: event.type });

  try {
    switch (event.type) {

      // ── Checkout terminé ───────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        log("checkout completed", { customerId: session.customer, email: session.customer_email });

        // Si un parrainage existe pour cet email → marquer comme converti
        if (session.customer_email) {
          await supabase
            .from("referrals")
            .update({ status: "converted" })
            .eq("referred_email", session.customer_email)
            .eq("status", "pending");
        }
        break;
      }

      // ── Premier paiement réussi → récompense parrain ──────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Seulement sur le premier vrai paiement (pas les essais)
        if ((invoice as unknown as { billing_reason: string }).billing_reason !== "subscription_create") break;

        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        if (!customer.email) break;

        log("first payment", { email: customer.email });

        // Cherche si cet utilisateur a été parrainé
        const { data: referral } = await supabase
          .from("referrals")
          .select("referrer_id, status")
          .eq("referred_email", customer.email)
          .eq("status", "converted")
          .single();

        if (!referral) break;

        // Récupère l'email du parrain
        const { data: { user } } = await supabase.auth.admin.getUserById(referral.referrer_id);
        if (!user?.email) break;

        // Cherche le client Stripe du parrain
        const referrerCustomers = await stripe.customers.list({ email: user.email, limit: 1 });
        const referrerCustomer = referrerCustomers.data[0];
        if (!referrerCustomer) break;

        // Crée un crédit d'1 mois gratuit pour le parrain
        const referrerSubs = await stripe.subscriptions.list({
          customer: referrerCustomer.id, status: "active", limit: 1,
        });
        const referrerTrialSubs = await stripe.subscriptions.list({
          customer: referrerCustomer.id, status: "trialing", limit: 1,
        });
        const activeSub = referrerSubs.data[0] ?? referrerTrialSubs.data[0];

        if (activeSub) {
          // Étend l'abonnement du parrain de 30 jours
          const currentEnd = activeSub.current_period_end;
          await stripe.subscriptions.update(activeSub.id, {
            trial_end: currentEnd + 30 * 24 * 60 * 60, // +30 jours
          });
          log("referrer rewarded", { referrerId: referral.referrer_id });
        }

        // Marque le parrainage comme récompensé
        await supabase
          .from("referrals")
          .update({ status: "rewarded" })
          .eq("referrer_id", referral.referrer_id)
          .eq("referred_email", customer.email);

        break;
      }

      // ── Abonnement annulé ─────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        log("subscription deleted", { customerId: sub.customer });
        // Rien à faire — check-subscription lit Stripe en temps réel
        break;
      }

      default:
        log("unhandled event", { type: event.type });
    }
  } catch (err) {
    log("handler error", { err: String(err) });
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
