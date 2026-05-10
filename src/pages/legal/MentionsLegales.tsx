import { Link } from "react-router-dom";
import { Building2, ArrowLeft } from "lucide-react";

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <Section title="1. Éditeur du site">
        <p>Le site <strong>LeadMatch Immo</strong> (accessible à l'adresse <strong>leadmatch-immo.netlify.app</strong>) est édité par :</p>
        <ul>
          <li><strong>Dénomination sociale :</strong> LeadMatch Immo (entreprise individuelle)</li>
          <li><strong>Responsable de la publication :</strong> Mohammed Fofana</li>
          <li><strong>Adresse :</strong> France</li>
          <li><strong>Email :</strong> <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">contact@leadmatch-immo.fr</a></li>
        </ul>
      </Section>

      <Section title="2. Hébergement">
        <p>Le site est hébergé par :</p>
        <ul>
          <li><strong>Frontend :</strong> Netlify, Inc. — 512 2nd Street, Suite 200, San Francisco, CA 94107, USA — <a href="https://www.netlify.com" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">netlify.com</a></li>
          <li><strong>Base de données &amp; fonctions :</strong> Supabase Inc. — 970 Toa Payoh North, Singapour — <a href="https://supabase.com" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">supabase.com</a></li>
          <li><strong>Paiements :</strong> Stripe, Inc. — 354 Oyster Point Blvd, South San Francisco, CA 94080, USA — <a href="https://stripe.com" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">stripe.com</a></li>
        </ul>
      </Section>

      <Section title="3. Propriété intellectuelle">
        <p>
          L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, sons, logiciels…) est la propriété exclusive de
          LeadMatch Immo, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
        </p>
        <p>
          Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que
          soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
        </p>
      </Section>

      <Section title="4. Responsabilité">
        <p>
          LeadMatch Immo s'efforce de maintenir les informations accessibles sur le site aussi exactes et à jour que possible.
          Toutefois, nous ne pouvons pas garantir l'exactitude, la complétude ou l'actualité des informations diffusées.
          En conséquence, l'utilisateur reconnaît utiliser ces informations sous sa responsabilité exclusive.
        </p>
      </Section>

      <Section title="5. Données personnelles">
        <p>
          Les informations relatives au traitement de vos données personnelles figurent dans notre{" "}
          <Link to="/confidentialite" className="text-blue-400 hover:underline">Politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="6. Cookies">
        <p>
          Le site utilise des cookies techniques nécessaires à son fonctionnement (authentification, session) et des cookies
          analytiques anonymisés. Aucun cookie publicitaire tiers n'est déposé sans votre consentement.
        </p>
      </Section>

      <Section title="7. Droit applicable">
        <p>
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
        </p>
        <p className="text-sm text-white/40 mt-4">Dernière mise à jour : mai 2026</p>
      </Section>
    </LegalLayout>
  );
}

/* ── Composants partagés ── */
function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#0A1628", color: "#E2E8F0" }}>
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1E4D8C] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">LeadMatch Immo</span>
        </Link>
        <span className="text-white/20">·</span>
        <span className="text-sm text-white/50">{title}</span>
      </nav>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <h1 className="text-3xl font-bold text-white mb-10">{title}</h1>
        <div className="space-y-10 text-sm leading-relaxed text-white/70">{children}</div>
      </div>

      {/* Footer */}
      <LegalFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_p]:text-white/70">{children}</div>
    </section>
  );
}

function LegalFooter() {
  return (
    <footer className="border-t border-white/10 py-8 mt-16">
      <div className="max-w-3xl mx-auto px-6 flex flex-wrap gap-4 text-xs text-white/30">
        <Link to="/mentions-legales" className="hover:text-white/60 transition-colors">Mentions légales</Link>
        <Link to="/confidentialite" className="hover:text-white/60 transition-colors">Politique de confidentialité</Link>
        <Link to="/cgu" className="hover:text-white/60 transition-colors">CGU</Link>
        <Link to="/cgv" className="hover:text-white/60 transition-colors">CGV</Link>
        <span className="ml-auto">© 2026 LeadMatch Immo</span>
      </div>
    </footer>
  );
}

export { LegalLayout, Section, LegalFooter };
