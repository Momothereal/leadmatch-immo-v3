/**
 * send-onboarding-email
 * Envoie les emails automatiques de la séquence onboarding via Resend.
 *
 * Appeler en POST avec :
 *   { user_id, email, first_name, day }  — day ∈ {1, 5, 12, "expire"}
 *
 * Déclenché par un cron Supabase (voir README) ou manuellement.
 *
 * Env vars nécessaires :
 *   RESEND_API_KEY    → clé API Resend (obtenez-la sur resend.com)
 *   PUBLIC_APP_URL    → URL du site (ex: https://leadmatch-immo-app.netlify.app)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("PUBLIC_APP_URL") ?? "https://leadmatch-immo-app.netlify.app";
// Utilise onboarding@resend.dev jusqu'à vérification du domaine leadmatch-immo.fr
// Une fois le domaine vérifié sur resend.com, remplacer par : "LeadMatch Immo <bonjour@leadmatch-immo.fr>"
const FROM = "LeadMatch Immo <onboarding@resend.dev>";

type EmailDay = 1 | 5 | 12 | "expire";

interface EmailPayload {
  user_id: string;
  email: string;
  first_name?: string;
  day: EmailDay;
  leads_count?: number;
}

function getTemplate(payload: EmailPayload) {
  const name = payload.first_name ?? "Agent";
  const appUrl = APP_URL;

  const templates: Record<EmailDay, { subject: string; html: string }> = {
    1: {
      subject: "🎯 Votre premier scoring en 2 minutes — commençons !",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <div style="background: #0F2D52; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; font-size: 22px; margin: 0;">Bonjour ${name} 👋</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Votre essai gratuit LeadMatch a commencé. En <strong>2 minutes</strong>, vous pouvez scorer vos premiers leads.
            </p>
            <h3 style="color: #0F2D52;">Pour commencer :</h3>
            <ol style="color: #374151; line-height: 1.9;">
              <li>Ajoutez un bien (adresse, prix, surface…)</li>
              <li>Importez vos leads depuis un fichier Excel</li>
              <li>Lancez le matching — l'IA calcule les scores en 30 sec</li>
            </ol>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${appUrl}/matching" style="background: #C8A96E; color: #0F2D52; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px;">
                🚀 Lancer mon premier matching
              </a>
            </div>
            <p style="font-size: 13px; color: #9CA3AF; text-align: center;">Des questions ? Répondez à cet email — je réponds personnellement.</p>
          </div>
        </div>
      `,
    },
    5: {
      subject: `📊 ${payload.leads_count ?? "Vos"} leads attendent un scoring`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <div style="background: #0F2D52; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; font-size: 22px; margin: 0;">LeadMatch — J+5</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Bonjour ${name},<br/><br/>
              ${payload.leads_count && payload.leads_count > 0
                ? `Vous avez <strong>${payload.leads_count} leads</strong> importés mais pas encore scorés.`
                : "Vous n'avez pas encore importé de leads."
              }
              Chaque lead non scoré = une opportunité ratée.
            </p>
            <div style="background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;">
                💡 <strong>Astuce :</strong> un matching prend 30 secondes.
                Les agents qui scorent leurs leads dès l'import convertissent <strong>3× plus</strong>.
              </p>
            </div>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${appUrl}/matching" style="background: #0F2D52; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px;">
                Scorer mes leads maintenant
              </a>
            </div>
          </div>
        </div>
      `,
    },
    12: {
      subject: "⏰ Votre essai expire dans 48h — ne perdez pas vos données",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <div style="background: #DC2626; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; font-size: 22px; margin: 0;">⏰ Plus que 48h !</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Bonjour ${name},<br/><br/>
              Votre essai gratuit LeadMatch se termine dans <strong>48 heures</strong>.
            </p>
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #991B1B;">
                ⚠️ Sans abonnement : vos leads, biens et scores seront inaccessibles à l'expiration.
              </p>
            </div>
            <h3 style="color: #0F2D52;">Nos offres :</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; vertical-align: top;">
                  <strong style="color: #0F2D52;">Standard</strong><br/>
                  <span style="font-size: 22px; font-weight: 700;">49€</span><span style="color: #6B7280;">/mois</span><br/>
                  <span style="font-size: 13px; color: #6B7280;">200 leads · 1 agent</span>
                </td>
                <td style="padding: 4px;"></td>
                <td style="padding: 12px; border: 2px solid #C8A96E; border-radius: 8px; vertical-align: top; background: #FFFBF0;">
                  <strong style="color: #0F2D52;">Pro ⭐</strong><br/>
                  <span style="font-size: 22px; font-weight: 700;">89€</span><span style="color: #6B7280;">/mois</span><br/>
                  <span style="font-size: 13px; color: #6B7280;">Leads illimités · 5 agents</span>
                </td>
              </tr>
            </table>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${appUrl}/pricing" style="background: #C8A96E; color: #0F2D52; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px;">
                Choisir mon abonnement
              </a>
            </div>
            <p style="font-size: 13px; color: #9CA3AF; text-align: center;">Résiliation possible à tout moment, sans engagement.</p>
          </div>
        </div>
      `,
    },
    expire: {
      subject: "🔔 Votre essai LeadMatch a expiré — reprenez où vous en étiez",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
          <div style="background: #374151; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; font-size: 22px; margin: 0;">Votre essai est terminé</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">
              Bonjour ${name},<br/><br/>
              Votre essai gratuit est terminé. <strong>Vos données sont toujours là</strong> —
              souscrivez pour y accéder à nouveau.
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${appUrl}/pricing" style="background: #0F2D52; color: white; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px;">
                Reprendre mon accès
              </a>
            </div>
          </div>
        </div>
      `,
    },
  };

  return templates[payload.day];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY non configuré — ajoutez-la dans les secrets Supabase");
    }

    const payload: EmailPayload = await req.json();
    if (!payload.email || !payload.day) throw new Error("email et day requis");

    // Récupérer le nombre de leads si non fourni
    if (!payload.leads_count && payload.user_id) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", payload.user_id);
      payload.leads_count = count ?? 0;
    }

    const template = getTemplate(payload);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.email],
        subject: template.subject,
        html: template.html,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message ?? "Erreur Resend");

    console.log(`[send-onboarding-email] Envoyé J+${payload.day} à ${payload.email} — ID: ${result.id}`);

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-onboarding-email] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
