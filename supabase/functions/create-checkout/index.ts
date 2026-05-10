import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (s: string, d?: unknown) =>
  console.log(`[create-checkout] ${s}${d ? ` ${JSON.stringify(d)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { priceId, promoCode, referralCode } = await req.json();
    if (!priceId) throw new Error("priceId is required");

    // Auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const anonSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await anonSupabase.auth.getUser(token);
    if (error) throw error;
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    log("user", { email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Client Stripe (cherche par email ou crée)
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id;

    // ── Résolution du code promo ──────────────────────────────
    let discounts: Array<{ promotion_code: string }> | undefined;
    let promoError: string | null = null;

    const codeToTry = promoCode?.trim().toUpperCase() || null;

    if (codeToTry) {
      log("looking up promo code", { code: codeToTry });
      const promos = await stripe.promotionCodes.list({
        code: codeToTry,
        active: true,
        limit: 1,
      });
      if (promos.data[0]) {
        discounts = [{ promotion_code: promos.data[0].id }];
        log("promo code found", { id: promos.data[0].id });
      } else {
        promoError = `Code promo "${codeToTry}" invalide ou expiré.`;
        log("promo code not found", { code: codeToTry });
      }
    }

    // ── Parrainage : si pas de code promo mais un code parrain ──
    if (!discounts && referralCode?.trim()) {
      const refCode = referralCode.trim().toUpperCase();
      log("looking up referral code", { refCode });

      // Cherche le parrain dans profiles
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", refCode)
        .single();

      if (referrer) {
        // Cherche le coupon parrainage dans Stripe (code fixe "PARRAIN")
        const promos = await stripe.promotionCodes.list({
          code: "PARRAIN",
          active: true,
          limit: 1,
        });
        if (promos.data[0]) {
          discounts = [{ promotion_code: promos.data[0].id }];
          log("referral discount applied", { referrerId: referrer.id });
        }

        // Enregistre le parrainage en DB
        await supabase.from("referrals").upsert({
          referrer_id: referrer.id,
          referred_id: user.id,
          referred_email: user.email,
          status: "converted",
        }, { onConflict: "referrer_id,referred_id" }).select();
      }
    }

    // Si erreur de code promo, on renvoie avant d'ouvrir Stripe
    if (promoError) {
      return new Response(JSON.stringify({ error: promoError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── Création de la session Stripe ──────────────────────────
    const origin = req.headers.get("origin") || "";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: { trial_period_days: 14 },
      ...(discounts
        ? { discounts, allow_promotion_codes: false }
        : { allow_promotion_codes: true }), // si pas de code, Stripe affiche le champ
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
    });

    log("session created", { url: session.url });
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
