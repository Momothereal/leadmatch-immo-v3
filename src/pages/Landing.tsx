import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { STRIPE_PRICES, startCheckout } from "@/lib/stripe";
import { toast } from "@/hooks/use-toast";

/**
 * Page d'accueil LeadMatch — design "Proto_lmi_Page_d_acueille".
 * Tous les liens internes utilisent <Link> de react-router et les ancres
 * de section. Si l'utilisateur est déjà connecté, les CTA renvoient au
 * dashboard.
 */
const Landing = () => {
  const { user } = useAuth();
  const ctaTo = user ? "/dashboard" : "/signup";
  const loginTo = user ? "/dashboard" : "/login";
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [proYearly, setProYearly] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate("/signup");
      return;
    }
    try {
      setLoadingPrice(priceId);
      await startCheckout(priceId);
    } catch (e) {
      toast({
        title: "Le paiement n'a pas pu démarrer",
        description:
          e instanceof Error
            ? e.message
            : "Une erreur inattendue est survenue. Réessayez dans un instant.",
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setLoadingPrice(null);
    }
  };

  // Reveal on scroll + animate score bars + stepper loop
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Reveal
    const reveals = root.querySelectorAll<HTMLElement>(".reveal");
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05 },
    );
    reveals.forEach((el) => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.95 && r.bottom > 0) el.classList.add("in");
      else revealIO.observe(el);
    });

    // Score bars
    const bars = root.querySelectorAll<HTMLElement>("[data-score]");
    const barIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const target = el.getAttribute("data-score") ?? "0";
            requestAnimationFrame(() => {
              el.style.width = target + "%";
            });
            barIO.unobserve(el);
          }
        });
      },
      { threshold: 0.2 },
    );
    bars.forEach((el) => barIO.observe(el));

    // Stepper
    const pills = root.querySelectorAll<HTMLElement>("#stepper .step");
    let idx = 1;
    let interval: number | undefined;
    if (pills.length) {
      const tick = () => {
        pills.forEach((p, i) => {
          p.classList.remove("done", "active");
          if (i < idx) p.classList.add("done");
          else if (i === idx) p.classList.add("active");
        });
        idx = idx + 1;
        if (idx > pills.length) idx = 0;
      };
      tick();
      interval = window.setInterval(tick, 2000);
    }

    return () => {
      revealIO.disconnect();
      barIO.disconnect();
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return (
    <div ref={rootRef} className="lm-landing">
      <style>{`
        .lm-landing { font-family: 'Inter', system-ui, sans-serif; background: #FFFFFF; color: #111827; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; scroll-behavior: smooth; }
        .lm-landing .h1 { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: #111827; }
        .lm-landing .h2 { font-size: clamp(1.75rem, 3vw, 2.25rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; color: #111827; }
        .lm-landing .lede { font-size: 1.125rem; font-weight: 400; color: #6B7280; line-height: 1.6; max-width: 580px; }
        .lm-landing .label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
        .lm-landing .eyebrow-section { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: #C8A96E; }
        .lm-landing .hero-bg { background: linear-gradient(160deg, #F0F4FF 0%, #FFFFFF 60%); }
        .lm-landing .cta-final-bg { background: linear-gradient(160deg, #0F2D52 0%, #1E4D8C 100%); }
        .lm-landing .btn-primary { background: #2563EB; color: #fff; font-weight: 600; box-shadow: 0 4px 14px rgba(37,99,235,0.35); transition: background 150ms ease, transform 150ms ease, box-shadow 200ms ease; }
        .lm-landing .btn-primary:hover { background: #1D4ED8; box-shadow: 0 8px 24px rgba(37,99,235,0.45); transform: translateY(-1px); }
        .lm-landing .btn-secondary { background: #fff; border: 1.5px solid #E5E7EB; color: #374151; font-weight: 500; transition: background 150ms ease, border-color 150ms ease; }
        .lm-landing .btn-secondary:hover { background: #F8FAFC; border-color: #D1D5DB; }
        .lm-landing .btn-gold { background: #C8A96E; color: #0F2D52; font-weight: 700; box-shadow: 0 8px 30px rgba(200,169,110,0.40); transition: background 150ms ease, transform 200ms ease, box-shadow 200ms ease; }
        .lm-landing .btn-gold:hover { background: #D4B880; transform: scale(1.04); box-shadow: 0 12px 40px rgba(200,169,110,0.55); }
        .lm-landing .btn-outline-blue { background: #fff; border: 1.5px solid #2563EB; color: #2563EB; font-weight: 600; transition: background 150ms ease; }
        .lm-landing .btn-outline-blue:hover { background: #EFF6FF; }
        .lm-landing .lm-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 200ms ease, transform 200ms ease; }
        .lm-landing .card-hover:hover { box-shadow: 0 8px 24px rgba(15,45,82,0.10); transform: translateY(-2px); }
        .lm-landing .pill-gold { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; border-radius: 9999px; background: #E8D5A3; color: #92702A; border: 1px solid rgba(200,169,110,0.5); font-size: 0.78rem; font-weight: 500; }
        .lm-landing .pill-base { display: inline-block; padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .lm-landing .pill-blue { background: #EFF6FF; color: #2563EB; }
        .lm-landing .pill-amber { background: #FEF3C7; color: #92400E; }
        .lm-landing .pill-green { background: #F0FDF4; color: #166534; }
        .lm-landing .score-bar { width: 100%; height: 6px; background: #F3F4F6; border-radius: 9999px; overflow: hidden; }
        .lm-landing .score-bar > span { display: block; height: 100%; border-radius: 9999px; transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1); width: 0%; }
        .lm-landing .browser-window { background: #fff; border: 1px solid #E5E7EB; border-radius: 18px; overflow: hidden; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10); transform: perspective(1400px) rotateX(2deg); }
        .lm-landing .browser-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1rem; background: #F3F4F6; border-bottom: 1px solid #E5E7EB; }
        .lm-landing .dot { width: 12px; height: 12px; border-radius: 9999px; }
        .lm-landing .reveal { opacity: 0; transform: translateY(20px); transition: opacity 600ms ease-out, transform 600ms ease-out; }
        .lm-landing .reveal.in { opacity: 1; transform: none; }
        .lm-landing .star { color: #F59E0B; letter-spacing: 2px; }
        .lm-landing .step { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.9rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; background: #F3F4F6; color: #9CA3AF; transition: all 250ms ease; }
        .lm-landing .step.done { background: #DCFCE7; color: #059669; }
        .lm-landing .step.active { background: #2563EB; color: #fff; box-shadow: 0 0 0 4px rgba(37,99,235,0.15); }
        .lm-landing .step .d { width: 6px; height: 6px; border-radius: 9999px; background: currentColor; opacity: 0.85; }
        .lm-landing .chev { color: #D1D5DB; }
        .lm-landing .avatar { width: 36px; height: 36px; border-radius: 9999px; background: #0F2D52; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.78rem; }
        @keyframes lmChevBounce { 0%, 100% { transform: translateY(0); opacity: 0.6; } 50% { transform: translateY(8px); opacity: 1; } }
        .lm-landing .chev-bounce { animation: lmChevBounce 1.6s ease-in-out infinite; }
        .lm-landing .nav-blur { backdrop-filter: saturate(140%) blur(10px); -webkit-backdrop-filter: saturate(140%) blur(10px); background: rgba(255,255,255,0.92); }
        .lm-landing .stat-divider { width: 1px; align-self: stretch; background: #E5E7EB; }
        .lm-landing .hairline { border-top: 1px solid #E5E7EB; }
        .lm-landing .quote-mark { font-family: 'Georgia', serif; font-size: 3.5rem; line-height: 1; color: #E8D5A3; }
        .lm-landing .text-ink-900 { color: #111827; }
        .lm-landing .text-ink-700 { color: #374151; }
        .lm-landing .text-ink-500 { color: #6B7280; }
        .lm-landing .text-ink-400 { color: #9CA3AF; }
        .lm-landing a:focus-visible, .lm-landing button:focus-visible { outline: 2px solid #2563EB; outline-offset: 3px; border-radius: 8px; }
      `}</style>

      {/* HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 nav-blur" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Link to="/" className="flex items-baseline gap-0.5">
            <span className="font-bold text-lg tracking-tight" style={{ color: "#0F2D52" }}>LeadMatch</span>
            <span className="font-bold text-lg" style={{ color: "#C8A96E" }}>·</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-ink-500 hover:text-[#0F2D52] transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-ink-500 hover:text-[#0F2D52] transition-colors">Tarifs</a>
            <a href="#about" className="text-ink-500 hover:text-[#0F2D52] transition-colors">À propos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to={loginTo} className="hidden sm:inline-flex px-3.5 py-2 rounded-lg text-sm font-medium" style={{ color: "#0F2D52", border: "1px solid #E5E7EB", background: "#fff" }}>
              {user ? "Mon espace" : "Connexion"}
            </Link>
            <Link to={ctaTo} className="btn-primary inline-flex px-3.5 py-2 rounded-lg text-sm">Essai gratuit</Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-20 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="pill-gold reveal">
              <span>✦</span> Intelligence artificielle · Immobilier
            </div>

            <h1 className="h1 mt-6 max-w-4xl reveal" style={{ transitionDelay: "80ms" }}>
              Votre prochain acheteur<br />
              est déjà dans <span style={{ color: "#0F2D52" }}>votre liste</span>.
            </h1>

            <p className="lede mt-6 mx-auto reveal" style={{ transitionDelay: "160ms" }}>
              LeadMatch analyse vos leads et vos biens avec l'IA pour vous indiquer qui contacter en priorité — avec les arguments pour convaincre.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center gap-4 reveal" style={{ transitionDelay: "240ms" }}>
              <div className="flex flex-col items-center">
                <Link to={ctaTo} className="btn-primary inline-flex items-center justify-center px-8 py-4 rounded-xl text-base">
                  Commencer gratuitement
                </Link>
                <span className="text-xs mt-2" style={{ color: "#9CA3AF" }}>Aucune carte bancaire requise</span>
              </div>
              <a href="#features" className="btn-secondary inline-flex items-center justify-center px-8 py-4 rounded-xl text-base">
                Voir le produit →
              </a>
            </div>

            <div className="mt-8 flex items-center gap-2 reveal" style={{ transitionDelay: "320ms" }}>
              <span className="star">★★★★★</span>
              <span className="text-ink-500 text-sm">
                <span className="font-semibold text-ink-900">200+</span> agents actifs ·{" "}
                <span className="font-semibold text-ink-900">1 200</span> matchs réalisés cette semaine
              </span>
            </div>

            {/* HERO MOCKUP */}
            <div className="w-full max-w-5xl mt-16 reveal" style={{ transitionDelay: "400ms" }}>
              <div className="browser-window">
                <div className="browser-bar">
                  <span className="dot" style={{ background: "#FF5F57" }} />
                  <span className="dot" style={{ background: "#FEBC2E" }} />
                  <span className="dot" style={{ background: "#28C840" }} />
                  <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-md text-xs" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#6B7280" }}>
                    <span>🔒</span> app.leadmatch.io / sessions
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-xs" style={{ color: "#9CA3AF" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                    LeadMatch — Matching
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  <div className="lg:col-span-2 p-6 bg-white">
                    <div className="flex items-center justify-between mb-5">
                      <div className="text-left">
                        <div className="label" style={{ color: "#6B7280" }}>Session active</div>
                        <h3 className="font-semibold text-lg mt-0.5 text-ink-900">Appartement T4 — Lyon Confluence</h3>
                      </div>
                      <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#6B7280" }}>4 leads scorés</div>
                    </div>

                    <div className="flex flex-col">
                      {[
                        { initials: "CL", bg: "#0F2D52", name: "Claire Lefèvre", city: "Lyon 6e", score: 92, color: "#059669", pillBg: "#DCFCE7", pillColor: "#059669", label: "Très chaud", checked: true, border: true },
                        { initials: "RD", bg: "#92400E", name: "Romain Darmon", city: "Villeurbanne", score: 74, color: "#EA580C", pillBg: "#FEF3C7", pillColor: "#D97706", label: "Chaud", checked: true, border: true },
                        { initials: "SN", bg: "#6B7280", name: "Sophie Nardin", city: "Caluire", score: 41, color: "#9CA3AF", pillBg: "#F3F4F6", pillColor: "#6B7280", label: "Tiède", checked: false, border: true },
                        { initials: "MK", bg: "#065F46", name: "Mehdi Karimi", city: "Lyon 2e", score: 87, color: "#059669", pillBg: "#DCFCE7", pillColor: "#059669", label: "Très chaud", checked: false, border: false },
                      ].map((l) => (
                        <div key={l.initials} className="py-4 flex items-center gap-4" style={l.border ? { borderBottom: "1px solid #F3F4F6" } : undefined}>
                          <input type="checkbox" defaultChecked={l.checked} className="w-4 h-4 accent-blue-600" />
                          <div className="avatar" style={{ background: l.bg }}>{l.initials}</div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-baseline justify-between gap-3">
                              <div className="text-ink-900 font-medium truncate">{l.name}</div>
                              <div className="text-xs" style={{ color: "#9CA3AF" }}>{l.city}</div>
                            </div>
                            <div className="mt-2 score-bar"><span data-score={l.score} style={{ background: l.color }} /></div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="font-bold tabular-nums text-ink-900">{l.score}<span className="text-ink-500 font-normal">/100</span></div>
                            <span className="pill-base" style={{ background: l.pillBg, color: l.pillColor }}>{l.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <aside className="p-6 text-left" style={{ background: "#F8FAFC", borderLeft: "1px solid #E5E7EB" }}>
                    <div className="label" style={{ color: "#6B7280" }}>Détail prospect</div>
                    <h4 className="font-semibold text-ink-900 mt-1">Claire Lefèvre</h4>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>Lyon 6e · T4 · 480k€</div>

                    <div className="mt-5">
                      <div className="text-xs" style={{ color: "#6B7280" }}>Score global</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold tabular-nums" style={{ color: "#0F2D52" }}>87</span>
                        <span className="text-ink-500 font-medium">/ 100</span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4">
                      {[
                        ["Budget", 85, "#0F2D52"],
                        ["Localisation", 68, "#0F2D52"],
                        ["Surface", 52, "#9CA3AF"],
                      ].map(([label, val, color]) => (
                        <div key={label as string}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span style={{ color: "#6B7280" }}>{label}</span>
                            <span className="text-ink-900 font-semibold tabular-nums">{val}%</span>
                          </div>
                          <div className="score-bar"><span data-score={val} style={{ background: color as string }} /></div>
                        </div>
                      ))}
                    </div>

                    <Link to={ctaTo} className="mt-6 w-full btn-primary rounded-lg py-2.5 text-sm inline-flex items-center justify-center">📞 Appeler Claire</Link>
                  </aside>
                </div>
              </div>
            </div>

            <a href="#problem" className="mt-12 chev-bounce inline-block" aria-label="Faire défiler">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* PROBLÈME */}
      <section id="problem" className="py-24" style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="h2 text-balance">
              L'agent immobilier perd en moyenne{" "}
              <span style={{ color: "#0F2D52", fontWeight: 800 }}>3 heures par jour</span> à chercher le bon profil.
            </h2>
            <p className="lede mt-5 mx-auto">Pas faute de leads. Faute de méthode pour les prioriser.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="lm-card card-hover p-6 reveal">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8A96E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6" /><path d="M9 16h6" /><path d="M9 8h.01" /></svg>
              </div>
              <div className="mt-5 text-5xl font-extrabold tracking-tight text-ink-900 tabular-nums">200+</div>
              <div className="mt-1 text-sm text-ink-500">leads à gérer en simultané</div>
              <p className="mt-3 text-ink-500 text-sm leading-relaxed">Sans outil, tous semblent aussi urgents les uns que les autres.</p>
            </div>
            <div className="lm-card card-hover p-6 reveal" style={{ transitionDelay: "80ms" }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: "rgba(234,88,12,0.10)", border: "1px solid rgba(234,88,12,0.25)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-3.49-2.95" /><path d="M5 5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h.18" /><line x1="22" y1="2" x2="2" y2="22" /></svg>
              </div>
              <div className="mt-5 text-5xl font-extrabold tracking-tight text-ink-900 tabular-nums">1<span className="text-3xl font-bold" style={{ color: "#9CA3AF" }}> sur </span>5</div>
              <div className="mt-1 text-sm text-ink-500">appels aboutissent à un vrai intérêt</div>
              <p className="mt-3 text-ink-500 text-sm leading-relaxed">80% du temps de prospection est investi sur les mauvais profils.</p>
            </div>
            <div className="lm-card card-hover p-6 reveal" style={{ transitionDelay: "160ms" }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: "#EFF6FF", border: "1px solid rgba(37,99,235,0.25)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div className="mt-5 text-5xl font-extrabold tracking-tight text-ink-900 tabular-nums">6 sem.</div>
              <div className="mt-1 text-sm text-ink-500">entre premier contact et signature</div>
              <p className="mt-3 text-ink-500 text-sm leading-relaxed">Chaque semaine de flottement, c'est une opportunité perdue.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION / FEATURES */}
      <section id="features" className="py-24" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="eyebrow-section">La solution</div>
            <h2 className="h2 mt-3 text-balance">
              LeadMatch fait le tri.<br />
              Vous faites les ventes.
            </h2>
          </div>

          {/* Feature 1 */}
          <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="reveal">
              <span className="pill-base pill-blue">Score IA</span>
              <h3 className="mt-4 text-3xl md:text-4xl font-bold text-ink-900" style={{ letterSpacing: "-0.02em" }}>Sachez qui appeler avant de décrocher.</h3>
              <p className="mt-4 text-ink-500 leading-relaxed">
                Chaque lead reçoit un score sur 100 calculé sur son budget, sa localisation, son timing et son type de bien recherché. Vous voyez immédiatement qui a 92% de compatibilité avec votre bien — et qui peut attendre.
              </p>
            </div>
            <div className="reveal" style={{ transitionDelay: "120ms" }}>
              <div className="lm-card p-8">
                <div className="flex items-center gap-4">
                  <div className="avatar" style={{ width: 48, height: 48, fontSize: "0.95rem" }}>CL</div>
                  <div className="flex-1">
                    <div className="text-ink-900 font-semibold">Claire Lefèvre</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>T4 — Lyon 6e · 480k€</div>
                  </div>
                </div>
                <div className="mt-6 flex flex-col items-center text-center" style={{ borderTop: "1px solid #F3F4F6", paddingTop: "1.25rem" }}>
                  <div className="text-6xl font-extrabold tabular-nums" style={{ color: "#059669" }}>92<span className="text-3xl text-ink-400 font-bold"> / 100</span></div>
                  <span className="mt-3 pill-base" style={{ background: "#FEF9C3", color: "#CA8A04" }}>🔥 Très chaud</span>
                </div>
                <div className="mt-6 flex flex-col gap-3.5">
                  {[
                    ["Budget", 95],
                    ["Localisation", 88],
                    ["Type de recherche", 90],
                    ["Timing", 75],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: "#6B7280" }}>{label}</span>
                        <span className="text-ink-900 font-semibold tabular-nums">{val}%</span>
                      </div>
                      <div className="score-bar"><span data-score={val} style={{ background: "#0F2D52" }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 reveal">
              <div className="lm-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="label" style={{ color: "#6B7280" }}>Nouvelle session</div>
                    <div className="mt-1 font-semibold text-ink-900">Maison T5 — Aix-en-Provence</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: "#F3F4F6", color: "#6B7280" }}>3 leads compatibles</span>
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  {[
                    { initials: "JM", bg: "#0F2D52", name: "Julien Marchand", info: "Budget 720k€ · T4-T5", score: 94, color: "#059669", checked: true },
                    { initials: "EP", bg: "#92400E", name: "Élise Perret", info: "Budget 650k€ · maison", score: 81, color: "#EA580C", checked: true },
                    { initials: "RC", bg: "#6B7280", name: "Renaud Caillet", info: "Budget 580k€ · T4", score: 62, color: "#9CA3AF", checked: false },
                  ].map((l) => (
                    <label key={l.initials} className="rounded-lg p-3 flex items-center gap-3 cursor-pointer" style={{ border: "1px solid #E5E7EB" }}>
                      <input type="checkbox" defaultChecked={l.checked} className="w-4 h-4 accent-blue-600" />
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.7rem", background: l.bg }}>{l.initials}</div>
                      <div className="flex-1 text-sm">
                        <div className="text-ink-900">{l.name}</div>
                        <div className="text-xs" style={{ color: "#9CA3AF" }}>{l.info}</div>
                      </div>
                      <div className="text-sm font-bold tabular-nums" style={{ color: l.color }}>{l.score}</div>
                    </label>
                  ))}
                </div>
                <Link to={ctaTo} className="mt-5 w-full btn-primary rounded-lg py-3 inline-flex items-center justify-center">⚡ Démarrer la session</Link>
                <div className="mt-2 text-center text-xs" style={{ color: "#9CA3AF" }}>Génération en moins de 30 secondes</div>
              </div>
            </div>
            <div className="order-1 lg:order-2 reveal" style={{ transitionDelay: "120ms" }}>
              <span className="pill-base pill-amber">Sessions</span>
              <h3 className="mt-4 text-3xl md:text-4xl font-bold text-ink-900" style={{ letterSpacing: "-0.02em" }}>Lancez un matching en 30 secondes chrono.</h3>
              <p className="mt-4 text-ink-500 leading-relaxed">
                Choisissez un bien, cochez vos leads. LeadMatch génère une session priorisée avec pour chaque paire : le score, les points forts à valoriser, et les objections à anticiper.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="reveal">
              <span className="pill-base pill-green">Pipeline</span>
              <h3 className="mt-4 text-3xl md:text-4xl font-bold text-ink-900" style={{ letterSpacing: "-0.02em" }}>De la présentation à la signature. Rien ne tombe.</h3>
              <p className="mt-4 text-ink-500 leading-relaxed">
                Chaque match suit un pipeline visuel : Présenté, Visite, Offre, Compromis, Conclu. Rappels, notes, historique — votre suivi est toujours à jour, même sur 200 dossiers.
              </p>
            </div>
            <div className="reveal" style={{ transitionDelay: "120ms" }}>
              <div className="lm-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="label" style={{ color: "#6B7280" }}>Match #182</div>
                    <div className="mt-1 font-semibold text-ink-900">Claire Lefèvre × T4 Confluence</div>
                  </div>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>Mis à jour il y a 2h</span>
                </div>
                <div id="stepper" className="mt-6 flex flex-wrap items-center gap-1.5">
                  {["Présenté", "Visite", "Offre", "Compromis", "Conclu"].map((s, i) => (
                    <span key={s} className="contents">
                      <span className="step" data-step={i}><span className="d" />{s}</span>
                      {i < 4 && <span className="chev">›</span>}
                    </span>
                  ))}
                </div>
                <div className="mt-6 hairline pt-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3 text-sm">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "#2563EB" }} />
                    <div>
                      <div className="text-ink-900 font-medium">Visite programmée — vendredi 16h</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>Rappel envoyé automatiquement à Claire</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full" style={{ background: "#D1D5DB" }} />
                    <div>
                      <div className="text-ink-700">Note : très intéressée par l'exposition sud</div>
                      <div className="text-xs" style={{ color: "#9CA3AF" }}>Ajoutée hier par vous</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREUVE SOCIALE */}
      <section className="py-24" style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="eyebrow-section">Ils nous font confiance</div>
            <h2 className="h2 mt-3 text-balance">
              Ils ont arrêté Excel.<br />
              Ils ne reviendront pas en arrière.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { initials: "SM", name: "Sophie M.", agency: "Marseille · Agence Côté Sud", quote: "Avant LeadMatch, je passais mes lundis à trier mes leads manuellement. Maintenant j'arrive avec ma shortlist prête. J'appelle 5 personnes au lieu de 20. Et je signe plus." },
              { initials: "TL", name: "Thomas L.", agency: "Lyon · Lemaire Immobilier", quote: "Le score m'a fait réaliser que certains leads que j'ignorais étaient mes meilleurs prospects. En 3 semaines, 2 ventes sur des contacts que j'avais mis de côté." },
              { initials: "AB", name: "Alexandre B.", agency: "Paris · Cabinet Bertrand", quote: "Ce qui m'a convaincu c'est le détail du score. Il ne dit pas juste 80/100. Il m'explique pourquoi, et ce que je dois dire au client. C'est comme avoir un assistant qui prépare chaque appel." },
            ].map((t) => (
              <article key={t.initials} className="lm-card p-6 flex flex-col">
                <div className="quote-mark">"</div>
                <div className="star -mt-3">★★★★★</div>
                <p className="mt-3 italic leading-relaxed text-ink-700">{t.quote}</p>
                <div className="hairline mt-5 pt-4 flex items-center gap-3">
                  <div className="avatar">{t.initials}</div>
                  <div className="text-sm">
                    <div className="text-ink-900 font-medium">{t.name}</div>
                    <div className="text-xs" style={{ color: "#9CA3AF" }}>{t.agency}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 lm-card p-8 flex flex-col md:flex-row items-stretch justify-around gap-6 md:gap-0">
            {[
              ["200+", "agences actives"],
              ["12 400", "leads scorés"],
              ["68%", "temps économisé"],
            ].map(([v, l], i) => (
              <span key={l} className="contents">
                <div className="text-center flex-1">
                  <div className="text-4xl md:text-5xl font-extrabold tabular-nums" style={{ color: "#0F2D52" }}>{v}</div>
                  <div className="mt-1 text-sm" style={{ color: "#6B7280" }}>{l}</div>
                </div>
                {i < 2 && <div className="stat-divider hidden md:block" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24" style={{ background: "#FFFFFF" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="eyebrow-section">Tarifs</div>
            <h2 className="h2 mt-3">Simple. Transparent. Sans engagement.</h2>
            <p className="lede mt-5 mx-auto">14 jours gratuits sur tous les plans. Annulation à tout moment.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Standard */}
            <div className="rounded-2xl p-8 flex flex-col" style={{ background: "#fff", border: "1.5px solid #E5E7EB" }}>
              <div className="text-sm font-semibold" style={{ color: "#6B7280" }}>Standard</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums text-ink-900">49€</span>
                <span className="text-lg text-ink-500">/mois</span>
              </div>
              <div className="text-sm" style={{ color: "#9CA3AF" }}>par agent</div>
              <div className="hairline mt-6 pt-6">
                <ul className="flex flex-col gap-3 text-sm">
                  {[
                    <>Jusqu'à <span className="font-semibold">200</span> leads importés</>,
                    <><span className="font-semibold">20</span> sessions de matching / mois</>,
                    "Score IA basique",
                    "Pipeline de suivi",
                    "Support email",
                  ].map((it, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 mt-0.5" style={{ color: "#059669" }}>✓</span>
                      <span className="text-ink-700">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => handleSubscribe(STRIPE_PRICES.starter_monthly)}
                disabled={loadingPrice === STRIPE_PRICES.starter_monthly}
                className="mt-8 btn-outline-blue rounded-xl py-3 text-center disabled:opacity-60"
              >
                {loadingPrice === STRIPE_PRICES.starter_monthly ? "Redirection…" : "Commencer l'essai gratuit"}
              </button>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl p-8 flex flex-col" style={{ background: "#0F2D52" }}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#C8A96E", color: "#0F2D52" }}>Le plus choisi</span>
              <div className="text-sm font-semibold" style={{ color: "#A5B4D4" }}>Pro</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tabular-nums" style={{ color: "#fff" }}>
                  {proYearly ? "80,10€" : "89€"}
                </span>
                <span className="text-lg" style={{ color: "#A5B4D4" }}>/mois</span>
              </div>
              {proYearly && (
                <div className="text-xs mt-1" style={{ color: "#A5B4D4" }}>
                  Facturé 961,20€/an
                </div>
              )}
              <div className="text-sm" style={{ color: "#A5B4D4" }}>par agence · jusqu'à <span className="font-semibold">5</span> agents</div>
              <div className="mt-4 inline-flex self-start items-center gap-1 p-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255,255,255,0.08)" }}>
                <button
                  type="button"
                  onClick={() => setProYearly(false)}
                  className="px-3 py-1 rounded-full transition-colors"
                  style={{ background: !proYearly ? "#C8A96E" : "transparent", color: !proYearly ? "#0F2D52" : "#A5B4D4" }}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setProYearly(true)}
                  className="px-3 py-1 rounded-full transition-colors"
                  style={{ background: proYearly ? "#C8A96E" : "transparent", color: proYearly ? "#0F2D52" : "#A5B4D4" }}
                >
                  Annuel −10%
                </button>
              </div>
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <ul className="flex flex-col gap-3 text-sm">
                  {["Leads illimités", "Sessions illimitées", "Score IA détaillé + arguments de vente", "Historique complet + exports", "Alertes et rappels automatiques", "Dashboard manager", "Support prioritaire"].map((it) => (
                    <li key={it} className="flex items-start gap-3">
                      <span className="shrink-0 mt-0.5" style={{ color: "#C8A96E" }}>✓</span>
                      <span style={{ color: "#fff" }}>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSubscribe(proYearly ? STRIPE_PRICES.pro_yearly : STRIPE_PRICES.pro_monthly)
                }
                disabled={loadingPrice !== null}
                className="mt-8 rounded-xl py-3 text-center font-bold disabled:opacity-60"
                style={{ background: "#C8A96E", color: "#0F2D52" }}
              >
                {loadingPrice && (loadingPrice === STRIPE_PRICES.pro_monthly || loadingPrice === STRIPE_PRICES.pro_yearly)
                  ? "Redirection…"
                  : "Démarrer maintenant"}
              </button>
              <div className="mt-3 text-center text-xs" style={{ color: "#A5B4D4" }}>14 jours gratuits · Aucune CB requise</div>
            </div>
          </div>

          <p className="mt-10 text-center text-sm" style={{ color: "#6B7280" }}>
            Équipe de plus de <span className="font-semibold">5</span> agents ?{" "}
            <a href="mailto:hello@leadmatch.io" className="font-semibold" style={{ color: "#2563EB" }}>Contactez-nous pour un tarif sur mesure →</a>
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="cta-final" className="cta-final-bg py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-balance" style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#fff" }}>
            Votre prochain client attend.<br />
            Vous ne savez pas encore qui c'est.
          </h2>
          <p className="mt-6 text-lg" style={{ color: "rgba(255,255,255,0.70)" }}>LeadMatch le sait. Essayez gratuitement pendant 14 jours.</p>
          <Link to={ctaTo} className="mt-10 inline-flex btn-gold px-12 py-5 rounded-xl text-lg">
            Commencer gratuitement — 14 jours offerts
          </Link>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="star">★★★★★</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Déjà <span className="font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>200+</span> agents qui matchent mieux.
            </span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="py-14" style={{ background: "#0A1628", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-baseline gap-0.5">
              <span className="font-bold text-lg tracking-tight" style={{ color: "#fff" }}>LeadMatch</span>
              <span className="font-bold text-lg" style={{ color: "#C8A96E" }}>·</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
              Le matching IA pour agents immobiliers qui veulent passer moins de temps à trier, et plus de temps à conclure.
            </p>
            <p className="mt-4 text-xs" style={{ color: "#64748B" }}>© 2026 LeadMatch. Tous droits réservés.</p>
          </div>

          <div>
            <div className="label mb-3" style={{ color: "#fff" }}>Produit</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="#features" style={{ color: "#94A3B8" }}>Fonctionnalités</a></li>
              <li><a href="#pricing" style={{ color: "#94A3B8" }}>Tarifs</a></li>
              <li><Link to={loginTo} style={{ color: "#94A3B8" }}>Connexion</Link></li>
            </ul>
          </div>
          <div>
            <div className="label mb-3" style={{ color: "#fff" }}>Légal</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/cgu" style={{ color: "#94A3B8" }}>CGU</Link></li>
              <li><Link to="/cgv" style={{ color: "#94A3B8" }}>CGV</Link></li>
              <li><Link to="/confidentialite" style={{ color: "#94A3B8" }}>Confidentialité</Link></li>
              <li><Link to="/mentions-legales" style={{ color: "#94A3B8" }}>Mentions légales</Link></li>
            </ul>
          </div>
          <div>
            <div className="label mb-3" style={{ color: "#fff" }}>Contact</div>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="mailto:contact@leadmatch-immo.fr" style={{ color: "#94A3B8" }}>contact@leadmatch-immo.fr</a></li>
              <li><Link to={ctaTo} style={{ color: "#94A3B8" }}>Demander une démo</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;