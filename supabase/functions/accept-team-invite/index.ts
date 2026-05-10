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

  // Service role client (pas besoin d'auth pour lire l'invitation)
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // ── GET : info publique de l'invitation (sans auth) ──────────────────────
  // Usage : GET /accept-team-invite?token=xxx
  if (req.method === "GET") {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return json({ error: "token manquant" }, 400);

    const { data: member, error } = await admin
      .from("team_members")
      .select("email, status, invited_at, teams(name, owner_id)")
      .eq("invite_token", token)
      .single();

    if (error || !member) return json({ error: "Invitation introuvable" }, 404);

    // Récupérer l'email de l'owner pour l'afficher
    const { data: ownerData } = await admin.auth.admin.getUserById(
      // @ts-ignore
      member.teams?.owner_id ?? "",
    );

    return json({
      invited_email: member.email,
      status: member.status,
      invited_at: member.invited_at,
      // @ts-ignore
      team_name: member.teams?.name ?? null,
      owner_email: ownerData?.user?.email ?? null,
    });
  }

  // ── POST : accepter l'invitation (auth requise) ──────────────────────────
  try {
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

    const { invite_token } = await req.json() as { invite_token?: string };
    if (!invite_token) return json({ error: "invite_token manquant" }, 400);

    const { data: member, error: findErr } = await admin
      .from("team_members")
      .select("id, email, status, teams(name)")
      .eq("invite_token", invite_token)
      .single();

    if (findErr || !member) return json({ error: "Invitation introuvable ou expirée" }, 404);
    if (member.status === "active") return json({ success: true, already: true, message: "Vous faites déjà partie de cette équipe." });
    if (member.status === "removed") return json({ error: "Cette invitation a été révoquée par l'administrateur." }, 409);

    // Vérifier que l'email correspond
    if (member.email.toLowerCase() !== user.email!.toLowerCase()) {
      return json(
        { error: `Cette invitation est réservée à ${member.email}.\nConnectez-vous avec cette adresse e-mail.` },
        403,
      );
    }

    // Accepter
    const { error: updateErr } = await admin
      .from("team_members")
      .update({ user_id: user.id, status: "active", joined_at: new Date().toISOString() })
      .eq("id", member.id);

    if (updateErr) throw updateErr;

    // @ts-ignore
    const teamName = member.teams?.name ?? "l'équipe";
    return json({ success: true, message: `Bienvenue dans ${teamName} !` });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 500);
  }
});
