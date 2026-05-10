import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Loader2, Building2, LogOut, Check, Tag, Gift, Copy, AlertCircle, ChevronRight } from "lucide-react";
import { STRIPE_PRICES, startCheckout } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useReferral } from "@/hooks/useReferral";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ─── helpers ─────────────────────────────────────────────── */
const btn: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: 8, width: "100%", padding: "13px 0", borderRadius: 12,
  fontWeight: 600, fontSize: 15, cursor: "pointer", border: "none",
  transition: "opacity 150ms, transform 150ms",
};

/* ─── Page ─────────────────────────────────────────────────── */
const Pricing = () => {
  const { user, signOut } = useAuth();
  const { subscribed } = useSubscription();
  const { referralCode, referralLink } = useReferral();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [proYearly, setProYearly] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  // Champ code promo / parrainage
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<{ code: string; type: "promo" | "referral" } | null>(null);
  const [promoError, setPromoError] = useState("");

  // Capture code parrainage depuis l'URL (?ref=CODE)
  const refParam = searchParams.get("ref");
  useEffect(() => {
    if (refParam && !appliedCode) {
      setAppliedCode({ code: refParam.toUpperCase(), type: "referral" });
      setPromoInput(refParam.toUpperCase());
    }
  }, [refParam]);

  // Déjà abonné → dashboard
  useEffect(() => {
    if (subscribed) navigate("/dashboard", { replace: true });
  }, [subscribed]);

  const handleApplyCode = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoError("Saisissez un code."); return; }
    setPromoError("");
    setAppliedCode({ code, type: "promo" }); // le type exact sera validé par Stripe
    toast({ title: `Code "${code}" appliqué`, description: "La réduction sera confirmée au paiement." });
  };

  const handleRemoveCode = () => {
    setAppliedCode(null);
    setPromoInput("");
    setPromoError("");
  };

  const handleSubscribe = async (priceId: string) => {
    if (!user) { navigate("/auth"); return; }
    try {
      setLoadingPrice(priceId);

      // Appel direct à Supabase functions avec les paramètres enrichis
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId,
          promoCode: appliedCode?.type === "promo" ? appliedCode.code : null,
          referralCode: appliedCode?.type === "referral" ? appliedCode.code : null,
        },
      });

      if (error || data?.error) {
        const msg = data?.error || error?.message || "Erreur lors du paiement.";
        if (msg.toLowerCase().includes("invalide") || msg.toLowerCase().includes("expiré")) {
          setPromoError(msg);
          setAppliedCode(null);
        } else {
          toast({ title: "Erreur", description: msg, variant: "destructive", duration: 8000 });
        }
        return;
      }
      if (!data?.url) throw new Error("URL de paiement manquante.");
      const win = window.open(data.url, "_blank");
      if (!win) throw new Error("Pop-up bloquée. Autorisez les pop-ups et réessayez.");
    } catch (e) {
      toast({
        title: "Paiement impossible",
        description: e instanceof Error ? e.message : "Erreur inattendue.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setLoadingPrice(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const copyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Lien copié !", description: "Partagez-le pour gagner 1 mois offert." });
  };

  const isLoading = (id: string) => loadingPrice === id;
  const anyLoading = loadingPrice !== null;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#F8FAFC", minHeight: "100vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin .9s linear infinite; }`}</style>

      {/* ── Header ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0F2D52", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0F2D52" }}>LeadMatch</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#C8A96E" }}>·</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#6B7280" }}>{user?.email}</span>
            <button onClick={handleSignOut} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280", background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* ── Titre ── */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 9999, background: "#EFF6FF", color: "#2563EB", fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
            ✦ Votre compte est prêt
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#111827", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Choisissez votre plan
          </h1>
          <p style={{ color: "#6B7280", fontSize: 15, margin: 0 }}>
            <strong style={{ color: "#059669" }}>14 jours gratuits</strong> · Aucune carte requise maintenant · Annulation à tout moment
          </p>
        </div>

        {/* ── Code promo / parrainage ── */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px 24px", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Tag size={16} color="#6B7280" />
            <span style={{ fontWeight: 600, fontSize: 14, color: "#374151" }}>Code promo ou code de parrainage</span>
          </div>

          {appliedCode ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} color="#059669" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#059669" }}>
                  {appliedCode.type === "referral" ? "🎁 Code parrainage" : "🏷️ Code promo"} : <code style={{ letterSpacing: "0.05em" }}>{appliedCode.code}</code>
                </span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>— réduction appliquée au paiement</span>
              </div>
              <button onClick={handleRemoveCode} style={{ fontSize: 12, color: "#DC2626", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Retirer</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={promoInput}
                onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                placeholder="Ex : LANCEMENT50, PARRAIN..."
                style={{ flex: 1, height: 42, padding: "0 14px", borderRadius: 10, border: `1px solid ${promoError ? "#FCA5A5" : "#E5E7EB"}`, fontSize: 14, outline: "none", letterSpacing: "0.04em", fontFamily: "inherit" }}
              />
              <button
                onClick={handleApplyCode}
                style={{ padding: "0 18px", height: 42, borderRadius: 10, background: "#0F2D52", color: "#fff", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
              >
                Appliquer
              </button>
            </div>
          )}
          {promoError && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: "#DC2626", fontSize: 13 }}>
              <AlertCircle size={14} /> {promoError}
            </div>
          )}
        </div>

        {/* ── Cards plans ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>

          {/* Standard */}
          <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 20, padding: "28px 28px 32px", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Standard</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 50, fontWeight: 800, color: "#111827", letterSpacing: "-0.04em" }}>49€</span>
              <span style={{ fontSize: 16, color: "#9CA3AF" }}>/mois</span>
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6 }}>par agent</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 24, display: "flex", alignItems: "center", gap: 4 }}>
              <ChevronRight size={12} /> Après 14 jours gratuits → <strong>49€/mois</strong>, annulable à tout moment
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                <>Jusqu'à <strong>200</strong> leads importés</>,
                <><strong>20</strong> sessions de matching / mois</>,
                "Score IA basique",
                "Pipeline de suivi",
                "Support email",
              ].map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#374151" }}>
                  <Check size={15} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(STRIPE_PRICES.starter_monthly)}
              disabled={anyLoading}
              style={{ ...btn, border: "1.5px solid #2563EB", background: "#fff", color: "#2563EB", opacity: anyLoading && !isLoading(STRIPE_PRICES.starter_monthly) ? 0.45 : 1 }}
            >
              {isLoading(STRIPE_PRICES.starter_monthly) ? <><Loader2 size={16} className="spin" />Redirection…</> : "Démarrer l'essai gratuit"}
            </button>
          </div>

          {/* Pro — recommandé */}
          <div style={{ background: "#0F2D52", borderRadius: 20, padding: "28px 28px 32px", display: "flex", flexDirection: "column", position: "relative", boxShadow: "0 12px 40px rgba(15,45,82,0.20)" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#C8A96E", color: "#0F2D52", fontWeight: 700, fontSize: 12, padding: "5px 16px", borderRadius: 9999, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
              ✦ Recommandé
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#A5B4D4", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 50, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em" }}>
                {proYearly ? "80€" : "89€"}
              </span>
              <span style={{ fontSize: 16, color: "#A5B4D4" }}>/mois</span>
            </div>
            {proYearly && <div style={{ fontSize: 12, color: "#A5B4D4", marginBottom: 4 }}>Facturé 961,20€/an (-10%)</div>}
            <div style={{ fontSize: 12, color: "#A5B4D4", marginBottom: 8 }}>par agence · jusqu'à <strong style={{ color: "#fff" }}>5</strong> agents</div>

            {/* Note "après 14 jours" */}
            <div style={{ fontSize: 12, color: "#7B96B8", marginBottom: 14, display: "flex", alignItems: "center", gap: 4 }}>
              <ChevronRight size={12} /> Après 14 jours gratuits → <strong style={{ color: "#A5B4D4" }}>{proYearly ? "80€" : "89€"}/mois</strong>, annulable
            </div>

            {/* Toggle mensuel / annuel */}
            <div style={{ display: "inline-flex", alignSelf: "flex-start", background: "rgba(255,255,255,0.08)", borderRadius: 9999, padding: 3, marginBottom: 24, fontSize: 12, fontWeight: 600 }}>
              <button onClick={() => setProYearly(false)} style={{ padding: "5px 14px", borderRadius: 9999, border: "none", cursor: "pointer", background: !proYearly ? "#C8A96E" : "transparent", color: !proYearly ? "#0F2D52" : "#A5B4D4", fontFamily: "inherit", fontWeight: 600 }}>
                Mensuel
              </button>
              <button onClick={() => setProYearly(true)} style={{ padding: "5px 14px", borderRadius: 9999, border: "none", cursor: "pointer", background: proYearly ? "#C8A96E" : "transparent", color: proYearly ? "#0F2D52" : "#A5B4D4", fontFamily: "inherit", fontWeight: 600 }}>
                Annuel −10%
              </button>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Leads illimités", "Sessions illimitées", "Score IA détaillé + arguments de vente", "Historique complet + exports", "Alertes et rappels automatiques", "Dashboard manager", "Support prioritaire"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "#fff" }}>
                  <Check size={15} color="#C8A96E" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(proYearly ? STRIPE_PRICES.pro_yearly : STRIPE_PRICES.pro_monthly)}
              disabled={anyLoading}
              style={{ ...btn, background: "#C8A96E", color: "#0F2D52", fontWeight: 700, boxShadow: "0 8px 24px rgba(200,169,110,0.35)", opacity: anyLoading && !isLoading(STRIPE_PRICES.pro_monthly) && !isLoading(STRIPE_PRICES.pro_yearly) ? 0.45 : 1 }}
            >
              {isLoading(STRIPE_PRICES.pro_monthly) || isLoading(STRIPE_PRICES.pro_yearly)
                ? <><Loader2 size={16} className="spin" /> Redirection…</>
                : "Démarrer maintenant — 14 jours offerts"}
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#7B96B8", margin: "10px 0 0" }}>
              Aucune CB requise pendant l'essai
            </p>
          </div>
        </div>

        {/* ── Parrainage (lien à partager) ── */}
        {referralLink && (
          <div style={{ marginTop: 36, background: "linear-gradient(135deg, #FFF7E6 0%, #FEF3C7 100%)", border: "1px solid #FDE68A", borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#C8A96E22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Gift size={20} color="#92702A" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#92400E", marginBottom: 4 }}>
                  🎁 Parrainez vos collègues — gagnez 1 mois offert
                </div>
                <p style={{ fontSize: 13, color: "#78350F", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Chaque agent qui s'inscrit via votre lien bénéficie d'une <strong>réduction exclusive</strong>. Vous, vous gagnez <strong>1 mois offert</strong> dès qu'il souscrit.
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, background: "#fff", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#92400E", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {referralLink}
                  </div>
                  <button
                    onClick={copyReferral}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "#C8A96E", color: "#0F2D52", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    <Copy size={14} /> Copier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact */}
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 13, color: "#6B7280" }}>
          Plus de 5 agents ?{" "}
          <a href="mailto:hello@leadmatch.io" style={{ color: "#2563EB", fontWeight: 600 }}>
            Contactez-nous pour un tarif sur mesure →
          </a>
        </p>
      </main>
    </div>
  );
};

export default Pricing;
