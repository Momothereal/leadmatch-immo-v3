import { LegalLayout, Section, LegalFooter } from "./MentionsLegales";
import { Link } from "react-router-dom";

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <Section title="1. Qui sommes-nous ?">
        <p>
          LeadMatch Immo est un logiciel SaaS de scoring IA pour agents immobiliers, édité par Mohammed Fofana (France).
          Contact : <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">contact@leadmatch-immo.fr</a>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
        <ul>
          <li><strong>Données de compte :</strong> adresse e-mail, mot de passe (chiffré, jamais stocké en clair)</li>
          <li><strong>Données métier :</strong> biens immobiliers et leads que vous importez dans l'application</li>
          <li><strong>Données de paiement :</strong> gérées exclusivement par Stripe — LeadMatch Immo ne stocke aucune donnée bancaire</li>
          <li><strong>Données techniques :</strong> logs de connexion, adresse IP, type de navigateur (à des fins de sécurité uniquement)</li>
        </ul>
      </Section>

      <Section title="3. Finalités du traitement">
        <ul>
          <li>Fourniture du service de scoring et matching immobilier</li>
          <li>Gestion de votre abonnement et de la facturation</li>
          <li>Envoi d'emails transactionnels (confirmation de compte, réinitialisation de mot de passe)</li>
          <li>Amélioration de la qualité du service (analyses agrégées et anonymisées)</li>
          <li>Respect de nos obligations légales</li>
        </ul>
      </Section>

      <Section title="4. Bases légales (RGPD)">
        <ul>
          <li><strong>Exécution du contrat</strong> — pour la fourniture du service</li>
          <li><strong>Intérêt légitime</strong> — pour la sécurité et la prévention des fraudes</li>
          <li><strong>Obligation légale</strong> — pour la conservation des données de facturation</li>
          <li><strong>Consentement</strong> — pour les cookies non essentiels (si applicable)</li>
        </ul>
      </Section>

      <Section title="5. Durée de conservation">
        <ul>
          <li><strong>Compte utilisateur actif :</strong> pendant toute la durée de l'abonnement + 30 jours après résiliation</li>
          <li><strong>Données de facturation :</strong> 10 ans (obligation comptable française)</li>
          <li><strong>Logs de sécurité :</strong> 12 mois maximum</li>
        </ul>
      </Section>

      <Section title="6. Partage des données">
        <p>Vos données ne sont jamais vendues. Elles peuvent être partagées uniquement avec :</p>
        <ul>
          <li><strong>Supabase</strong> — hébergement de la base de données (serveurs en UE)</li>
          <li><strong>Netlify</strong> — hébergement du frontend</li>
          <li><strong>Stripe</strong> — traitement des paiements (certifié PCI DSS niveau 1)</li>
          <li><strong>Anthropic (Claude AI)</strong> — analyse IA des leads (données transmises de façon anonymisée)</li>
        </ul>
      </Section>

      <Section title="7. Vos droits (RGPD)">
        <p>Vous disposez des droits suivants sur vos données :</p>
        <ul>
          <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
          <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
          <li><strong>Droit à l'effacement :</strong> demander la suppression de votre compte et de vos données</li>
          <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition :</strong> vous opposer à certains traitements</li>
          <li><strong>Droit de limitation :</strong> restreindre le traitement dans certains cas</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à{" "}
          <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">contact@leadmatch-immo.fr</a>.
          Nous répondrons dans un délai maximum de 30 jours. Vous pouvez également introduire une réclamation auprès de la{" "}
          <a href="https://www.cnil.fr" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">CNIL</a>.
        </p>
      </Section>

      <Section title="8. Sécurité">
        <ul>
          <li>Chiffrement TLS en transit (HTTPS)</li>
          <li>Mots de passe hachés (bcrypt via Supabase Auth)</li>
          <li>Row Level Security (RLS) — chaque utilisateur n'accède qu'à ses propres données</li>
          <li>Authentification à deux facteurs disponible</li>
          <li>Accès aux données de production restreint au personnel autorisé</li>
        </ul>
      </Section>

      <Section title="9. Cookies">
        <p>Nous utilisons uniquement des cookies strictement nécessaires :</p>
        <ul>
          <li><strong>Cookie de session</strong> (Supabase Auth) — expire à la fermeture du navigateur ou après 7 jours</li>
          <li><strong>Préférences UI</strong> — stockées en localStorage, aucun tiers impliqué</li>
        </ul>
        <p>Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
      </Section>

      <Section title="10. Modifications">
        <p>
          Nous nous réservons le droit de modifier cette politique. En cas de changement significatif, vous serez notifié
          par email ou par une bannière sur l'application. La date de dernière mise à jour figure en bas de cette page.
        </p>
        <p className="text-sm text-white/40 mt-4">Dernière mise à jour : mai 2026</p>
      </Section>
    </LegalLayout>
  );
}
