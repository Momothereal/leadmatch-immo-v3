import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, Mail, Lock, ArrowRight, Building2, Sparkles, Zap, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const credSchema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
});

const Auth = ({ defaultMode = "signin" }: { defaultMode?: "signin" | "signup" }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref"); // code parrainage dans l'URL
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptedCGU, setAcceptedCGU] = useState(false);
  const [acceptedData, setAcceptedData] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Connexion impossible", { description: error.message });
      return;
    }
    toast.success("Bienvenue !");
    navigate("/dashboard", { replace: true });
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!acceptedCGU) {
      toast.error("Acceptation requise", { description: "Vous devez accepter les CGU et la politique de confidentialité." });
      return;
    }
    if (!acceptedData) {
      toast.error("Acceptation requise", { description: "Vous devez accepter la politique d'utilisation des données." });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: `${window.location.origin}/pricing` },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Inscription impossible", { description: error.message });
      return;
    }
    toast.success("Compte créé !", { description: "Choisissez votre plan pour commencer." });
    // Transmettre le code de parrainage s'il existe
    const pricingUrl = refCode ? `/pricing?ref=${refCode}` : "/pricing";
    navigate(pricingUrl, { replace: true });
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Email invalide");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Envoi impossible", { description: error.message });
      return;
    }
    toast.success("Email envoyé", { description: "Consultez votre boîte de réception." });
    setMode("signin");
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Panneau gauche marketing */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-[#0F2D52] text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1E4D8C] flex items-center justify-center">
            <Building2 className="w-[18px] h-[18px] text-white" strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-white">LeadMatch</div>
            <div className="text-xs font-medium text-[#C8A96E]">Immo</div>
          </div>
        </div>

        <div className="space-y-8 max-w-md">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-[rgba(200,169,110,0.15)] border border-[rgba(200,169,110,0.3)] text-[#C8A96E]">
            <Sparkles className="w-3 h-3" /> Propulsé par Claude IA
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Matchez vos biens<br />avec les bons acheteurs.
          </h1>
          <p className="text-base text-white/60 leading-relaxed">
            Scoring IA pour agences immobilières. Concentrez-vous sur les prospects qui comptent vraiment.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { v: "94%", l: "Précision du scoring" },
              { v: "<3s", l: "Temps d'analyse IA" },
              { v: "50×", l: "Leads scorés ensemble" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl p-4 text-center bg-white/5 border border-white/10">
                <div className="text-2xl font-black text-white">{s.v}</div>
                <div className="text-[11px] text-white/40 mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {[
              { Icon: Zap, t: "Scoring IA en temps réel", s: "Claude analyse chaque lead en secondes" },
              { Icon: Users, t: "Import Excel en un clic", s: "Jusqu'à 500 leads importés" },
              { Icon: TrendingUp, t: "Matching multi-critères", s: "Budget, ville, timing, financement" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(200,169,110,0.15)] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#C8A96E]" />
                </div>
                <div className="leading-tight pt-1">
                  <div className="text-sm font-semibold text-white">{t}</div>
                  <div className="text-xs text-white/40">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-white/20">© 2025 LeadMatch Immo</div>
      </div>

      {/* Panneau droit formulaire */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0F2D52] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm font-bold text-[#111827]">LeadMatch Immo</div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#111827]">
            {mode === "forgot" ? "Mot de passe oublié" : mode === "signup" ? "Créer un compte" : "Connexion"}
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            {mode === "forgot"
              ? "Recevez un lien de réinitialisation par email."
              : mode === "signup"
              ? "Créez votre espace agence en 30 secondes."
              : "Accédez à votre espace agence."}
          </p>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email-forgot" className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <Input
                  id="email-forgot"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-[#F8FAFC] border-[#E5E7EB] focus-visible:bg-white focus-visible:border-[#2563EB]"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl bg-[#0F2D52] hover:bg-[#1E4D8C] text-white font-semibold" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Envoyer le lien
            </Button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-xs text-[#2563EB] hover:text-[#1E4D8C] w-full text-center"
            >
              ← Retour à la connexion
            </button>
          </form>
        ) : (
          <>
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <CredFields
                  email={email}
                  password={password}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  autoCompletePass="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-[#2563EB] hover:text-[#1E4D8C] block ml-auto"
                >
                  Mot de passe oublié ?
                </button>
                <Button type="submit" className="w-full h-11 rounded-xl bg-[#0F2D52] hover:bg-[#1E4D8C] text-white font-semibold" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-1.5" />}
                  Se connecter
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-[#9CA3AF]">Pas encore de compte ?</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="w-full h-10 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]"
                >
                  Créer un compte
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <CredFields
                  email={email}
                  password={password}
                  setEmail={setEmail}
                  setPassword={setPassword}
                  autoCompletePass="new-password"
                />
                <p className="text-[11px] text-[#9CA3AF]">
                  14 jours d'essai gratuit · Aucune carte bancaire requise.
                </p>

                {/* Checkboxes consentement obligatoires */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedCGU}
                      onChange={(e) => setAcceptedCGU(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#0F2D52]"
                      required
                    />
                    <span className="text-[11px] text-[#6B7280] leading-relaxed">
                      J'accepte les{" "}
                      <Link to="/cgu" target="_blank" className="text-[#2563EB] hover:underline font-medium">CGU</Link>
                      {", "}
                      <Link to="/cgv" target="_blank" className="text-[#2563EB] hover:underline font-medium">CGV</Link>
                      {" et les "}
                      <Link to="/mentions-legales" target="_blank" className="text-[#2563EB] hover:underline font-medium">Mentions légales</Link>
                      {" de LeadMatch Immo. "}
                      <span className="text-[#EF4444] font-semibold">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={acceptedData}
                      onChange={(e) => setAcceptedData(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#D1D5DB] accent-[#0F2D52]"
                      required
                    />
                    <span className="text-[11px] text-[#6B7280] leading-relaxed">
                      J'accepte la{" "}
                      <Link to="/confidentialite" target="_blank" className="text-[#2563EB] hover:underline font-medium">politique de confidentialité</Link>
                      {", notamment l'utilisation de mes données d'usage pour produire des statistiques de marché agrégées et anonymisées, et la possibilité de mise en relation avec des partenaires (courtiers, assureurs) avec le consentement des prospects concernés. "}
                      <span className="text-[#EF4444] font-semibold">*</span>
                    </span>
                  </label>
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl bg-[#0F2D52] hover:bg-[#1E4D8C] text-white font-semibold" disabled={submitting || !acceptedCGU || !acceptedData}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
                  Créer le compte
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E7EB]" /></div>
                  <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-[#9CA3AF]">Déjà un compte ?</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="w-full h-10 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#374151] hover:bg-[#F8FAFC]"
                >
                  Se connecter
                </button>
              </form>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

const CredFields = ({
  email,
  password,
  setEmail,
  setPassword,
  autoCompletePass,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  autoCompletePass: string;
}) => (
  <>
    <div className="space-y-1.5">
      <Label htmlFor="email" className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Email</Label>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-[#F8FAFC] border-[#E5E7EB] focus-visible:bg-white focus-visible:border-[#2563EB]"
          required
        />
      </div>
    </div>
    <div className="space-y-1.5">
      <Label htmlFor="password" className="text-xs font-semibold text-[#374151] uppercase tracking-wide">Mot de passe</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <Input
          id="password"
          type="password"
          autoComplete={autoCompletePass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-[#F8FAFC] border-[#E5E7EB] focus-visible:bg-white focus-visible:border-[#2563EB]"
          minLength={8}
          required
        />
      </div>
    </div>
  </>
);

export default Auth;