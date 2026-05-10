import { useState, useEffect, type FormEvent } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useReferral } from "@/hooks/useReferral";
import { useSubscription } from "@/hooks/useSubscription";
import { useTeam, MAX_SEATS, MAX_MONTHLY } from "@/hooks/useTeam";
import { STRIPE_PRICES } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  User, Building2, Phone, Mail, Lock, Gift, Copy, Check,
  Loader2, Users, Award, Eye, EyeOff, UserPlus, Trash2,
  ShieldCheck, Clock, Crown, Download, AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { referralCode, referralLink } = useReferral();
  const { plan, price_id } = useSubscription() as { plan: string | null; price_id: string | null };
  const isPro = plan === "admin" || price_id === STRIPE_PRICES.pro_monthly || price_id === STRIPE_PRICES.pro_yearly;
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exportingLeads, setExportingLeads] = useState(false);
  const [exportingProps, setExportingProps] = useState(false);

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

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) { toast.error("Aucune donnée à exporter"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(";"),
      ...rows.map((r) => headers.map((h) => {
        const v = r[h] ?? "";
        const s = String(v).replace(/"/g, '""');
        return s.includes(";") || s.includes("\n") ? `"${s}"` : s;
      }).join(";")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${rows.length} lignes exportées`);
  };

  const handleExportLeads = async () => {
    setExportingLeads(true);
    const { data } = await supabase.from("leads").select("*").eq("user_id", user!.id);
    setExportingLeads(false);
    if (data) exportCSV(data as Record<string, unknown>[], `leads_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportProps = async () => {
    setExportingProps(true);
    const { data } = await supabase.from("properties").select("*").eq("user_id", user!.id);
    setExportingProps(false);
    if (data) exportCSV(data as Record<string, unknown>[], `biens_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ── Suppression de compte ─────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") {
      toast.error('Tapez "SUPPRIMER" pour confirmer');
      return;
    }
    setDeleting(true);
    try {
      // Supprimer les données utilisateur (leads, biens, profiles)
      await supabase.from("leads").delete().eq("user_id", user!.id);
      await supabase.from("properties").delete().eq("user_id", user!.id);
      await supabase.from("profiles").delete().eq("id", user!.id);
      // Déconnexion (la suppression auth nécessite le service role — l'utilisateur est déloggué)
      await signOut();
      navigate("/", { replace: true });
      toast.success("Compte supprimé", { description: "Toutes vos données ont été effacées." });
    } catch (e) {
      setDeleting(false);
      toast.error("Erreur lors de la suppression", { description: (e as Error).message });
    }
  };

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

        {/* ── Équipe Pro ── */}
        {isPro && <TeamSection userEmail={user?.email ?? ""} />}

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

        {/* ── Export données ── */}
        <Section title="Exporter mes données" icon={Download}>
          <p className="text-sm text-muted-foreground">
            Téléchargez vos leads et biens en CSV — conformément à votre droit à la portabilité (RGPD Art. 20).
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="outline"
              className="h-9 gap-2 text-sm"
              onClick={handleExportLeads}
              disabled={exportingLeads}
            >
              {exportingLeads ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Leads (CSV)
            </Button>
            <Button
              variant="outline"
              className="h-9 gap-2 text-sm"
              onClick={handleExportProps}
              disabled={exportingProps}
            >
              {exportingProps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Biens (CSV)
            </Button>
          </div>
        </Section>

        {/* ── Suppression de compte ── */}
        <Section title="Supprimer mon compte" icon={AlertTriangle}>
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 space-y-4">
            <p className="text-sm text-red-700 leading-relaxed">
              <strong>Action irréversible.</strong> Toutes vos données (leads, biens, historique de matchs) seront
              définitivement supprimées. Votre abonnement Stripe doit être résilié séparément.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-red-700 block">
                Tapez <span className="font-mono bg-red-100 px-1 rounded">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="SUPPRIMER"
                className="h-9 w-full rounded-lg border border-red-200 bg-white px-3 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== "SUPPRIMER"}
              className="w-full h-9 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer définitivement mon compte
            </button>
          </div>
        </Section>

      </div>
    </AppLayout>
  );
}

// ─── Section Équipe Pro ───────────────────────────────────────────────────────
function TeamSection({ userEmail }: { userEmail: string }) {
  const {
    team, members, loading,
    usedSeats, remainingSeats, usedActions, maxMonthly,
    inviteAgent, removeAgent, inviting, removing,
  } = useTeam();

  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await inviteAgent(inviteEmail.trim());
    setInviteEmail("");
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedToken(token);
      toast.success("Lien d'invitation copié !");
      setTimeout(() => setCopiedToken(null), 2500);
    });
  };

  const statusBadge = (status: string) => {
    if (status === "active") return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
        <ShieldCheck className="w-3 h-3" /> Actif
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
        <Clock className="w-3 h-3" /> En attente
      </span>
    );
  };

  return (
    <Section title="Équipe Pro — Gestion des agents" icon={Users}>
      {/* En-tête : sièges + actions */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px] rounded-xl border border-line-soft bg-secondary/40 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{usedSeats + 1}<span className="text-sm font-normal text-muted-foreground">/{MAX_SEATS}</span></div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Sièges occupés</div>
        </div>
        <div className="flex-1 min-w-[140px] rounded-xl border border-line-soft bg-secondary/40 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{remainingSeats}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Places disponibles</div>
        </div>
        <div className="flex-1 min-w-[140px] rounded-xl border border-line-soft bg-secondary/40 p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{usedActions}<span className="text-sm font-normal text-muted-foreground">/{maxMonthly}</span></div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Actions ce mois</div>
        </div>
      </div>

      {/* Vous (owner) */}
      <div className="rounded-xl border border-line-soft p-3 flex items-center gap-3 bg-primary/5">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-[13px] font-bold text-[hsl(var(--gold))] shrink-0">
          {userEmail[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{userEmail}</div>
          <div className="text-[11px] text-muted-foreground">Vous</div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0F2D52]/10 text-[#0F2D52] border border-[#0F2D52]/20">
          <Crown className="w-3 h-3" /> Admin
        </span>
      </div>

      {/* Liste des agents */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : members.length > 0 ? (
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.id} className="rounded-xl border border-line-soft p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-[13px] font-bold text-muted-foreground shrink-0">
                {m.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{m.email}</div>
                <div className="text-[11px] text-muted-foreground">Agent</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(m.status)}
                {m.status === "pending" && (
                  <button
                    onClick={() => copyInviteLink(m.invite_token)}
                    className="w-7 h-7 rounded-lg border border-line-soft flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                    title="Copier le lien d'invitation"
                  >
                    {copiedToken === m.invite_token ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => removeAgent(m.id)}
                  disabled={removing}
                  className="w-7 h-7 rounded-lg border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                  title="Retirer l'agent"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Aucun agent invité pour l'instant.
        </p>
      )}

      {/* Formulaire d'invitation */}
      {remainingSeats > 0 ? (
        <form onSubmit={handleInvite} className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@agent.fr"
              className="h-10 pl-10"
              required
            />
          </div>
          <Button type="submit" disabled={inviting || !inviteEmail.trim()} className="h-10 px-4 shrink-0">
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Inviter"}
          </Button>
        </form>
      ) : (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
          Limite atteinte — 4 agents maximum sur le plan Pro.
        </div>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Chaque agent invité reçoit un lien unique à partager. Il doit créer un compte avec l'adresse e-mail indiquée.
        Maximum <strong>{MAX_SEATS - 1} agents</strong> + vous = {MAX_SEATS} sièges au total.
        Les add/remove sont limités à <strong>{maxMonthly}</strong> par mois calendaire (anti-abus).
      </p>
    </Section>
  );
}
