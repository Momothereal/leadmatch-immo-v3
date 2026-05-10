import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // ── Auth : récupérer l'utilisateur appelant ──────────────────────────
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non authentifié" }, 401);

    const { data: { user }, error: authErr } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !user) return json({ error: "Token invalide" }, 401);

    // ── Body ─────────────────────────────────────────────────────────────
    const { invite_token } = await req.json() as { invite_token?: string };
    if (!invite_token) return json({ error: "invite_token manquant" }, 400);

    // ── Service role pour contourner RLS ─────────────────────────────────
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // ── Chercher l'invitation ─────────────────────────────────────────────
    const { data: member, error: findErr } = await admin
      .from("team_members")
      .select("id, email, status, team_id, teams(owner_id, name)")
      .eq("invite_token", invite_token)
      .single();

    if (findErr || !member) return json({ error: "Invitation introuvable ou expirée" }, 404);
    if (member.status !== "pending") return json({ error: "Cette invitation a déjà été utilisée" }, 409);

    // ── Vérifier que l'email correspond ───────────────────────────────────
    if (member.email.toLowerCase() !== user.email!.toLowerCase()) {
      return json(
        { error: `Cette invitation est réservée à ${member.email}. Connectez-vous avec cette adresse.` },
        403,
      );
    }

    // ── Accepter ─────────────────────────────────────────────────────────
    const { error: updateErr } = await admin
      .from("team_members")
      .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() })
      .eq("id", member.id);

    if (updateErr) throw updateErr;

    // @ts-ignore dynamic join
    const teamName = member.teams?.name ?? "l'équipe";
    return json({ success: true, message: `Vous avez rejoint ${teamName} !` });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
