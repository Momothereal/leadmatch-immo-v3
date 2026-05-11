/**
 * process-onboarding-emails
 * Appelée chaque jour par pg_cron (8h00 UTC).
 * Parcourt tous les utilisateurs en essai et envoie le bon email selon le jour.
 *
 * Séquence :
 *   J+1  → "Lancez votre premier scoring"
 *   J+5  → "Vos leads attendent un scoring"
 *   J+12 → "Votre essai expire dans 48h"
 *   J+14 → "Votre essai est terminé"
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL     = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY      = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY       = Deno.env.get("RESEND_API_KEY") ?? "";
const APP_URL          = Deno.env.get("PUBLIC_APP_URL") ?? "https://leadmatch-immo-app.netlify.app";
const FROM             = "LeadMatch Immo <onboarding@resend.dev>";

// Jours de la séquence
const EMAIL_DAYS = [1, 5, 12, 14] as const;
type EmailDay = typeof EMAIL_DAYS[number];

const log = (msg: string, d?: unknown) =>
  console.log(`[process-onboarding-emails] ${msg}${d ? " " + JSON.stringify(d) : ""}`);

// ── Templates identiques à send-onboarding-email ─────────────────────────────
function buildEmail(day: EmailDay, name: string, leadsCount: number): { subject: string; html: string } {
  const n = name || "Agent";

  if (day === 1) return {
    subject: "🎯 Votre premier scoring en 2 minutes — commençons !",
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <div style="background:#0F2D52;padding:32px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;font-size:22px;margin:0">Bonjour ${n} 👋</h1>
      </div>
      <div style="background:white;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
        <p style="font-size:16px;line-height:1.6;color:#374151">Votre essai gratuit LeadMatch a commencé.<br/>En <strong>2 minutes</strong> vous pouvez scorer vos premiers leads.</p>
        <ol style="color:#374151;line-height:1.9"><li>Ajoutez un bien</li><li>Importez vos leads</li><li>Lancez le matching IA — scores en 30 sec</li></ol>
        <div style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/matching" style="background:#C8A96E;color:#0F2D52;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block;font-size:15px">🚀 Lancer mon premier matching</a>
        </div>
        <p style="font-size:13px;color:#9CA3AF;text-align:center">Des questions ? Répondez directement à cet email.</p>
      </div>
    </div>`,
  };

  if (day === 5) return {
    subject: `📊 ${leadsCount > 0 ? leadsCount + " leads attendent" : "Vos leads attendent"} un scoring`,
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <div style="background:#0F2D52;padding:32px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;font-size:22px;margin:0">LeadMatch — Jour 5</h1>
      </div>
      <div style="background:white;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
        <p style="font-size:16px;line-height:1.6;color:#374151">Bonjour ${n},<br/><br/>
          ${leadsCount > 0 ? `Vous avez <strong>${leadsCount} leads</strong> importés mais pas encore tous scorés.` : "Vous n'avez pas encore importé de leads."}
          Chaque lead non scoré = une opportunité manquée.</p>
        <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#374151">💡 <strong>Astuce :</strong> un matching prend 30 secondes. Les agents qui scorent leurs leads convertissent <strong>3× plus</strong>.</p>
        </div>
        <div style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/matching" style="background:#0F2D52;color:white;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block;font-size:15px">Scorer mes leads maintenant</a>
        </div>
      </div>
    </div>`,
  };

  if (day === 12) return {
    subject: "⏰ Votre essai expire dans 48h — ne perdez pas vos données",
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <div style="background:#DC2626;padding:32px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;font-size:22px;margin:0">⏰ Plus que 48h !</h1>
      </div>
      <div style="background:white;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
        <p style="font-size:16px;line-height:1.6;color:#374151">Bonjour ${n},<br/><br/>Votre essai gratuit LeadMatch expire dans <strong>48 heures</strong>.</p>
        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0;font-size:14px;color:#991B1B">⚠️ Sans abonnement : vos leads, biens et scores seront inaccessibles.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <tr>
            <td style="padding:12px;border:1px solid #E5E7EB;border-radius:8px;vertical-align:top">
              <strong style="color:#0F2D52">Standard</strong><br/>
              <span style="font-size:22px;font-weight:700">49€</span><span style="color:#6B7280">/mois</span><br/>
              <span style="font-size:13px;color:#6B7280">200 leads · 1 agent</span>
            </td>
            <td style="padding:4px"></td>
            <td style="padding:12px;border:2px solid #C8A96E;border-radius:8px;vertical-align:top;background:#FFFBF0">
              <strong style="color:#0F2D52">Pro ⭐</strong><br/>
              <span style="font-size:22px;font-weight:700">89€</span><span style="color:#6B7280">/mois</span><br/>
              <span style="font-size:13px;color:#6B7280">Leads illimités · 5 agents</span>
            </td>
          </tr>
        </table>
        <div style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/pricing" style="background:#C8A96E;color:#0F2D52;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block;font-size:15px">Choisir mon abonnement</a>
        </div>
        <p style="font-size:13px;color:#9CA3AF;text-align:center">Sans engagement · résiliation en 1 clic</p>
      </div>
    </div>`,
  };

  // day === 14 (expire)
  return {
    subject: "🔔 Votre essai LeadMatch a expiré — reprenez où vous en étiez",
    html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;color:#111827">
      <div style="background:#374151;padding:32px;border-radius:16px 16px 0 0;text-align:center">
        <h1 style="color:white;font-size:22px;margin:0">Votre essai est terminé</h1>
      </div>
      <div style="background:white;padding:32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 16px 16px">
        <p style="font-size:16px;line-height:1.6;color:#374151">Bonjour ${n},<br/><br/>Votre essai gratuit est terminé. <strong>Vos données sont toujours là</strong> — souscrivez pour y accéder à nouveau.</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/pricing" style="background:#0F2D52;color:white;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;display:inline-block;font-size:15px">Reprendre mon accès</a>
        </div>
      </div>
    </div>`,
  };
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!r.ok) {
    const err = await r.json();
    log("Resend error", err);
    return false;
  }
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const stats = { checked: 0, sent: 0, skipped: 0, errors: 0 };

  try {
    // 1. Récupérer tous les utilisateurs avec leur date de création
    const { data: users, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    log(`${users.users.length} utilisateurs à traiter`);

    for (const user of users.users) {
      stats.checked++;
      const daysSinceSignup = Math.floor((Date.now() - +new Date(user.created_at)) / 86_400_000);

      // Déterminer quel email envoyer aujourd'hui
      let emailDay: EmailDay | null = null;
      if (daysSinceSignup === 1)  emailDay = 1;
      else if (daysSinceSignup === 5)  emailDay = 5;
      else if (daysSinceSignup === 12) emailDay = 12;
      else if (daysSinceSignup === 14) emailDay = 14;

      if (!emailDay) { stats.skipped++; continue; }

      // Vérifier si l'email a déjà été envoyé
      const { data: already } = await supabase
        .from("onboarding_email_log")
        .select("id")
        .eq("user_id", user.id)
        .eq("email_day", String(emailDay))
        .maybeSingle();

      if (already) { stats.skipped++; continue; }

      // Récupérer le prénom depuis profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();

      const firstName = profile?.first_name ?? user.email?.split("@")[0] ?? "Agent";

      // Compter les leads
      const { count: leadsCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Construire et envoyer l'email
      const { subject, html } = buildEmail(emailDay, firstName, leadsCount ?? 0);
      const sent = await sendEmail(user.email!, subject, html);

      if (sent) {
        // Logger pour éviter les doublons
        await supabase.from("onboarding_email_log").insert({
          user_id: user.id,
          email_day: String(emailDay),
        });
        stats.sent++;
        log(`Email J+${emailDay} envoyé à ${user.email}`);
      } else {
        stats.errors++;
      }
    }

    log("Traitement terminé", stats);
    return new Response(JSON.stringify({ success: true, ...stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", msg);
    return new Response(JSON.stringify({ error: msg, ...stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
