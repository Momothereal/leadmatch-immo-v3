import { useState, useEffect, type FormEvent } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  User, Building2, Phone, Mail, Lock, Gift, Copy, Check,
  Loader2, Users, Award, Eye, EyeOff,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  first_name: string | null;
  last_name: string | null;
  agency_name: string | null;
  phone: string | null;
  referral_code: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line-soft bg-card p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Account() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { referralCode, referralLink } = useReferral();
  const [copied, setCopied] = useState(false);

  // ── Profil ────────────────────────────────────────────────────────────────
  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, agency_name, phone, referral_code")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setAgencyName(profile.agency_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user!.id,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          agency_name: agencyName.trim() || null,
          phone: phone.trim() || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profil mis à jour");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: Error) => toast.error("Erreur", { description: e.message }),
  });

  // ── Email ─────────────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const handleEmailUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailLoading(false);
    if (error) {
      toast.error("Impossible de modifier l'email", { description: error.message });
    } else {
      toast.success("Email de confirmation envoyé", {
        description: "Cliquez sur le lien reçu pour valider la nouvelle adresse.",
      });
      setNewEmail("");
    }
  };

  // ── Mot de passe ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Mot de passe actuel requis");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mot de passe trop court", { description: "8 caractères minimum." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("Le nouveau mot de passe doit être différent de l'actuel");
      return;
    }
    setPwLoading(true);
    // Vérification du mot de passe actuel via re-authentification
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });
    if (signInError) {
      setPwLoading(false);
      toast.error("Mot de passe actuel incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      toast.error("Impossible de modifier le mot de passe", { description: error.message });
    } else {
      toast.success("Mot de passe mis à jour");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // ── Referrals stats ───────────────────────────────────────────────────────
  const { data: referralStats } = useQuery({
    queryKey: ["referral-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("status")
        .eq("referrer_id", user!.id);
      if (error) throw error;
      const total = data.length;
      const converted = data.filter((r) => r.status === "converted" || r.status === "rewarded").length;
      const rewarded = data.filter((r) => r.status === "rewarded").length;
      return { total, converted, rewarded };
    },
  });

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <AppLayout title="Mon compte">
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* ── Informations personnelles ── */}
        <Section title="Informations personnelles" icon={User}>
          {profileLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prénom">
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Mohammed"
                    className="h-10"
                  />
                </Field>
                <Field label="Nom">
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Fofana"
                    className="h-10"
                  />
                </Field>
              </div>
              <Field label="Agence / Réseau">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Mon agence immobilière"
                    className="h-10 pl-10"
                  />
                </div>
              </Field>
              <Field label="Téléphone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    className="h-10 pl-10"
                    type="tel"
                  />
                </div>
              </Field>
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={saveProfile.isPending}
                  className="h-9 px-5 text-sm"
                >
                  {saveProfile.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </form>
          )}
        </Section>

        {/* ── Adresse email ── */}
        <Section title="Adresse e-mail" icon={Mail}>
          <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm text-foreground font-medium">
            {user?.email}
          </div>
          <form onSubmit={handleEmailUpdate} className="space-y-3 pt-1">
            <Field label="Nouvelle adresse e-mail">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouvelle@email.com"
                className="h-10"
              />
            </Field>
            <p className="text-[11px] text-muted-foreground">
              Un email de confirmation vous sera envoyé. Le changement ne sera effectif qu'après validation.
            </p>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                disabled={emailLoading || !newEmail.trim()}
                className="h-9 px-5 text-sm"
              >
                {emailLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Changer l'email
              </Button>
            </div>
          </form>
        </Section>

        {/* ── Mot de passe ── */}
        <Section title="Mot de passe" icon={Lock}>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Field label="Mot de passe actuel">
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="h-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <div className="border-t border-line-soft" />

            <Field label="Nouveau mot de passe">
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  className="h-10 pr-10"
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <Field label="Confirmer le nouveau mot de passe">
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                  className="h-10 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Indicateur de correspondance */}
              {confirmPassword && (
                <p className={`text-[11px] mt-1 ${newPassword === confirmPassword ? "text-green-500" : "text-red-400"}`}>
                  {newPassword === confirmPassword ? "✓ Les mots de passe correspondent" : "✗ Les mots de passe ne correspondent pas"}
                </p>
              )}
            </Field>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
                className="h-9 px-5 text-sm"
              >
                {pwLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Modifier le mot de passe
              </Button>
            </div>
          </form>
        </Section>

        {/* ── Parrainage ── */}
        <Section title="Parrainage" icon={Gift}>
          {/* Banner */}
          <div className="rounded-xl bg-gradient-to-r from-[#0F2D52] to-[#1E4D8C] p-4 space-y-3">
            <p className="text-sm font-semibold text-white">
              Parrainez un collègue · 1 mois offert
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              Chaque filleul qui souscrit un abonnement vous offre{" "}
              <span className="text-[#C8A96E] font-semibold">1 mois gratuit</span> sur votre abonnement.
              Partagez votre lien unique ci-dessous.
            </p>

            {/* Lien à copier */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 px-3 rounded-lg bg-white/10 border border-white/20 text-xs text-white/80 font-mono flex items-center truncate">
                {referralLink ?? "Chargement…"}
              </div>
              <button
                onClick={copyLink}
                className="h-9 w-9 rounded-lg bg-[#C8A96E] hover:bg-[#b8995c] flex items-center justify-center shrink-0 transition"
                title="Copier le lien"
              >
                {copied
                  ? <Check className="w-4 h-4 text-[#0F2D52]" />
                  : <Copy className="w-4 h-4 text-[#0F2D52]" />
                }
              </button>
            </div>

            {/* Code brut */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-white/40">Code :</span>
              <span className="text-[13px] font-mono font-bold text-[#C8A96E] tracking-widest">
                {referralCode ?? "—"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Filleuls invités",
                value: referralStats?.total ?? 0,
                icon: Users,
              },
              {
                label: "Abonnés",
                value: referralStats?.converted ?? 0,
                icon: Award,
              },
              {
                label: "Mois gagnés",
                value: referralStats?.rewarded ?? 0,
                icon: Gift,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-line-soft bg-secondary/40 p-4 text-center space-y-1"
              >
                <Icon className="w-4 h-4 text-muted-foreground mx-auto" />
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-[11px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Le mois gratuit est crédité automatiquement dès que votre filleul effectue son premier
            paiement. Consultez les{" "}
            <Link to="/cgv" className="text-primary hover:underline">CGV</Link>{" "}
            pour les conditions complètes.
          </p>
        </Section>

      </div>
    </AppLayout>
  );
}
