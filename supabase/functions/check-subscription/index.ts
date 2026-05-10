import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Emails admin — accès complet sans abonnement Stripe
const ADMIN_EMAILS = ["fofanamohammed05@gmail.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Bypass admin — accès Pro illimité sans passer par Stripe
    if (ADMIN_EMAILS.includes(user.email)) {
      return new Response(
        JSON.stringify({ subscribed: true, status: "active", plan: "admin", price_id: null, product_id: null, subscription_end: null, trial_end: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "all",
      limit: 1,
    });
    const sub = subs.data[0];
    const active = sub && ["active", "trialing"].includes(sub.status);
    return new Response(
      JSON.stringify({
        subscribed: !!active,
        status: sub?.status ?? null,
        product_id: active ? sub.items.data[0].price.product : null,
        price_id: active ? sub.items.data[0].price.id : null,
        subscription_end: active
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        trial_end: sub?.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});