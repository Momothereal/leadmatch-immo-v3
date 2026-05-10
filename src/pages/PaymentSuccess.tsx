import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Building2, Zap, Users, Target } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { plan, refetch } = useSubscription();
  const [dots, setDots] = useState(".");

  // Rafraîchir l'abonnement dès l'arrivée (le webhook peut prendre quelques secondes)
  useEffect(() => {
    refetch();
    const t1 = setTimeout(() => refetch(), 3000);
    const t2 = setTimeout(() => refetch(), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [refetch]);

  // Animation dots
  useEffect(() => {
    const iv = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(iv);
  }, []);

  const isPro = plan === "admin" || searchParams.get("plan") === "pro";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center space-y-8">

        {/* Icône succès */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#C8A96E] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#0F2D52]">✓</span>
            </div>
          </div>
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-[#111827]">Bienvenue sur LeadMatch !</h1>
          <p className="text-[#6B7280] text-lg">
            Votre abonnement {isPro ? "Pro" : "Standard"} est actif.
            Votre essai de 14 jours commence maintenant.
          </p>
        </div>

        {/* 3 étapes de démarrage */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-left space-y-4">
          <p className="text-sm font-semibold text-[#374151] uppercase tracking-wide">
            Démarrer en 3 étapes
          </p>
          {[
            { icon: Building2, color: "#0F2D52", title: "Ajoutez votre premier bien", desc: "Renseignez le bien que vous souhaitez vendre ou louer.", to: "/properties" },
            { icon: Users, color: "#2563EB", title: "Importez vos leads", desc: "Importez votre fichier Excel ou saisissez manuellement.", to: "/leads" },
            { icon: Target, color: "#C8A96E", title: "Lancez un matching IA", desc: "Obtenez vos scores en moins de 30 secondes.", to: "/matching" },
          ].map(({ icon: Icon, color, title, desc, to }, i) => (
            <Link key={to} to={to} className="flex items-start gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] transition group">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#111827] flex items-center gap-1">
                  <span className="text-[#9CA3AF] mr-1">{i + 1}.</span>
                  {title}
                  <ArrowRight className="w-3.5 h-3.5 text-[#9CA3AF] ml-auto opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-xs text-[#6B7280] mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Astuce Pro */}
        {isPro && (
          <div className="bg-gradient-to-r from-[#0F2D52] to-[#1E4D8C] rounded-2xl p-5 text-left text-white space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#C8A96E]" />
              <span className="text-sm font-semibold">Vous êtes sur le plan Pro</span>
            </div>
            <p className="text-xs text-white/70">
              Invitez jusqu'à 4 agents dans votre équipe depuis <strong className="text-white">Mon compte → Équipe Pro</strong>.
              Leads illimités, sessions illimitées, scoring IA détaillé.
            </p>
          </div>
        )}

        {/* CTA */}
        <Link to="/dashboard">
          <Button className="w-full h-12 bg-[#0F2D52] hover:bg-[#1E4D8C] text-white rounded-xl text-base font-semibold">
            Accéder à mon dashboard →
          </Button>
        </Link>

        <p className="text-xs text-[#9CA3AF]">
          Une confirmation vous a été envoyée par email.
          Des questions ? <a href="mailto:contact@leadmatch-immo.fr" className="text-[#2563EB] hover:underline">contact@leadmatch-immo.fr</a>
        </p>
      </div>
    </div>
  );
}
