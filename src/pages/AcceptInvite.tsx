import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Loader2, CheckCircle2, XCircle, Building2,
  UserCheck, UserPlus, Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────
interface InviteInfo {
  invited_email: string;
  status: string;
  team_name: string | null;
  owner_email: string | null;
}

type PageState =
  | { kind: "loading" }
  | { kind: "ready"; info: InviteInfo }          // pas connecté, invite valide
  | { kind: "accepting" }                         // connecté, en cours
  | { kind: "success"; message: string }
  | { kind: "already" }                           // déjà membre
  | { kind: "error"; message: string }
  | { kind: "invalid" };                          // token introuvable

// ── Helpers ───────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 text-center space-y-5">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-[#0F2D52] flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>({ kind: "loading" });

  // ── 1. Charger l'info de l'invitation (sans auth, GET public) ─────────────
  useEffect(() => {
    if (!token) { setState({ kind: "invalid" }); return; }

    supabase.functions.invoke("accept-team-invite", {
      method: "GET",
      headers: { "x-invite-token": token },
      // On passe le token via query string
      body: null,
    }).catch(() => null);

    // L'edge function ne supporte pas les query params via invoke,
    // on appelle directement l'URL REST
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-team-invite?token=${token}`;
    fetch(url, {
      headers: {
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setState({ kind: "invalid" }); return; }
        setState({ kind: "ready", info: data as InviteInfo });
      })
      .catch(() => setState({ kind: "invalid" }));
  }, [token]);

  // ── 2. Si utilisateur connecté + invite ready → accepter automatiquement ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (state.kind !== "ready" && state.kind !== "loading") return;

    const accept = async () => {
      setState({ kind: "accepting" });
      try {
        const { data, error } = await supabase.functions.invoke("accept-team-invite", {
          body: { invite_token: token },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (data?.already) { setState({ kind: "already" }); return; }
        setState({ kind: "success", message: data.message });
        setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
      } catch (e) {
        setState({ kind: "error", message: e instanceof Error ? e.message : "Une erreur est survenue." });
      }
    };

    // N'accepter que si l'info est chargée (ou en "loading" au démarrage quand user déjà connecté)
    if (state.kind === "ready" || state.kind === "loading") {
      accept();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, state.kind]);

  // ── Rendu ─────────────────────────────────────────────────────────────────

  if (state.kind === "loading") {
    return (
      <Card>
        <Loader2 className="w-8 h-8 animate-spin text-[#0F2D52] mx-auto" />
        <p className="text-sm text-[#6B7280]">Chargement de l'invitation…</p>
      </Card>
    );
  }

  if (state.kind === "accepting") {
    return (
      <Card>
        <Loader2 className="w-8 h-8 animate-spin text-[#0F2D52] mx-auto" />
        <p className="text-sm text-[#6B7280]">Acceptation de l'invitation…</p>
      </Card>
    );
  }

  if (state.kind === "success") {
    return (
      <Card>
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
        <div>
          <p className="font-semibold text-[#111827]">{state.message}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Redirection vers le dashboard…</p>
        </div>
      </Card>
    );
  }

  if (state.kind === "already") {
    return (
      <Card>
        <CheckCircle2 className="w-10 h-10 text-blue-500 mx-auto" />
        <p className="font-semibold text-[#111827]">Vous faites déjà partie de cette équipe</p>
        <Link to="/dashboard">
          <Button className="w-full bg-[#0F2D52] hover:bg-[#1E4D8C] text-white">Aller au dashboard</Button>
        </Link>
      </Card>
    );
  }

  if (state.kind === "invalid") {
    return (
      <Card>
        <XCircle className="w-10 h-10 text-red-400 mx-auto" />
        <div>
          <p className="font-semibold text-[#111827]">Invitation invalide</p>
          <p className="text-sm text-[#6B7280] mt-1">Ce lien est introuvable ou a déjà été utilisé.</p>
        </div>
        <Link to="/">
          <Button className="w-full" variant="outline">Retour à l'accueil</Button>
        </Link>
      </Card>
    );
  }

  if (state.kind === "error") {
    return (
      <Card>
        <XCircle className="w-10 h-10 text-red-400 mx-auto" />
        <div>
          <p className="font-semibold text-[#111827]">Impossible d'accepter</p>
          <p className="text-sm text-[#6B7280] mt-1 whitespace-pre-line">{state.message}</p>
        </div>
        <Link to="/dashboard">
          <Button className="w-full" variant="outline">Retour au dashboard</Button>
        </Link>
      </Card>
    );
  }

  // ── state === "ready" + non connecté : deux chemins clairs ───────────────
  const info = state.info;
  const teamLabel = info.team_name ?? (info.owner_email ? `l'équipe de ${info.owner_email}` : "une équipe LeadMatch");

  return (
    <Card>
      {/* En-tête invitation */}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C8A96E]">Invitation</p>
        <p className="text-lg font-bold text-[#111827]">Rejoindre {teamLabel}</p>
        <p className="text-sm text-[#6B7280]">
          Cette invitation est réservée à{" "}
          <span className="font-semibold text-[#111827]">{info.invited_email}</span>
        </p>
      </div>

      <div className="border-t border-[#F3F4F6]" />

      {/* Chemin 1 : compte existant */}
      <div className="space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <UserCheck className="w-4 h-4 text-[#2563EB]" />
          J'ai déjà un compte LeadMatch
        </div>
        <p className="text-xs text-[#6B7280] pl-6">
          Connectez-vous avec <strong>{info.invited_email}</strong> pour rejoindre l'équipe automatiquement.
        </p>
        <Link to={`/login?invite=${token}`} className="block pl-6">
          <Button className="w-full bg-[#0F2D52] hover:bg-[#1E4D8C] text-white h-10">
            Se connecter
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-[#F3F4F6]" />
        <span className="text-xs text-[#9CA3AF]">ou</span>
        <div className="flex-1 border-t border-[#F3F4F6]" />
      </div>

      {/* Chemin 2 : pas de compte */}
      <div className="space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <UserPlus className="w-4 h-4 text-[#059669]" />
          Je n'ai pas encore de compte
        </div>
        <p className="text-xs text-[#6B7280] pl-6">
          Créez un compte avec l'adresse <strong>{info.invited_email}</strong>.
          Vous recevrez un e-mail de confirmation — revenez ensuite sur ce lien pour rejoindre l'équipe.
        </p>
        <Link to={`/signup?invite=${token}`} className="block pl-6">
          <Button variant="outline" className="w-full h-10 border-[#059669] text-[#059669] hover:bg-green-50">
            Créer un compte
          </Button>
        </Link>
      </div>

      {/* Note confirmation email */}
      <div className="rounded-lg bg-[#FEF9C3] border border-amber-100 px-3 py-2 flex gap-2 items-start text-left">
        <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <strong>Pas de compte ?</strong> Après inscription, vous recevrez un e-mail de confirmation.
          Cliquez sur le lien dans cet e-mail, puis <strong>revenez sur ce lien d'invitation</strong> pour être ajouté à l'équipe.
        </p>
      </div>
    </Card>
  );
}
