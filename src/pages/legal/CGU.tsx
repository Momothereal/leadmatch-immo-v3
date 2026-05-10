import { LegalLayout, Section } from "./MentionsLegales";
import { Link } from "react-router-dom";

export default function CGU() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation">
      <p className="text-white/50 text-xs -mt-6 mb-4">En vigueur depuis le 1er mai 2026</p>

      <Section title="1. Objet">
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) définissent les modalités d'accès et d'utilisation de la
          plateforme <strong>LeadMatch Immo</strong>, logiciel SaaS de scoring IA pour agents immobiliers, éditée par Mohammed Fofana.
        </p>
        <p>
          L'utilisation du service implique l'acceptation pleine et entière des présentes CGU.
        </p>
      </Section>

      <Section title="2. Accès au service">
        <p>
          Le service est accessible 24h/24, 7j/7, sous réserve des maintenances planifiées ou urgentes.
          Nous nous réservons le droit d'interrompre temporairement l'accès sans préavis pour des raisons techniques ou de sécurité.
        </p>
        <p>
          L'accès requiert la création d'un compte avec une adresse e-mail valide et un abonnement actif (après la période d'essai de 14 jours).
        </p>
      </Section>

      <Section title="3. Compte utilisateur">
        <ul>
          <li>Chaque utilisateur ne peut disposer que d'un seul compte</li>
          <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
          <li>Vous devez nous notifier immédiatement de toute utilisation non autorisée de votre compte</li>
          <li>Les comptes créés avec de fausses informations peuvent être supprimés sans préavis</li>
          <li>Le partage de compte entre plusieurs utilisateurs est interdit</li>
        </ul>
      </Section>

      <Section title="4. Utilisation du service">
        <p>Vous vous engagez à utiliser LeadMatch Immo dans le respect des lois en vigueur et à ne pas :</p>
        <ul>
          <li>Importer des données personnelles sans base légale (RGPD)</li>
          <li>Utiliser le service à des fins illicites ou frauduleuses</li>
          <li>Tenter de contourner les protections techniques du service</li>
          <li>Reproduire, copier ou exploiter commercialement le service sans autorisation</li>
          <li>Saturer intentionnellement nos serveurs (attaque DDoS, scraping massif…)</li>
          <li>Importer des données de prospects sans leur consentement ou sans base légale</li>
        </ul>
      </Section>

      <Section title="5. Données importées">
        <p>
          En tant que responsable de traitement de vos leads et biens, vous êtes seul responsable de la conformité RGPD des données
          que vous importez dans LeadMatch Immo. LeadMatch Immo agit en tant que sous-traitant au sens de l'article 28 du RGPD.
        </p>
        <p>
          Vous garantissez disposer des droits nécessaires pour importer et traiter ces données via notre plateforme.
        </p>
      </Section>

      <Section title="6. Intelligence artificielle">
        <p>
          Le scoring IA est fourni à titre indicatif. Les résultats constituent une aide à la décision et ne sauraient
          remplacer le jugement professionnel de l'agent immobilier. LeadMatch Immo décline toute responsabilité quant aux
          décisions commerciales prises sur la base des scores générés.
        </p>
      </Section>

      <Section title="7. Propriété intellectuelle">
        <p>
          LeadMatch Immo et ses composants (code, design, algorithmes, marque) sont la propriété exclusive de Mohammed Fofana.
          L'abonnement vous confère uniquement un droit d'usage personnel, non exclusif et non transférable.
        </p>
        <p>
          Vos données (leads, biens) restent votre propriété. Vous pouvez les exporter ou les supprimer à tout moment.
        </p>
      </Section>

      <Section title="8. Disponibilité et garanties">
        <p>
          Nous visons un taux de disponibilité de 99,5 % (hors maintenances). Aucune garantie n'est donnée quant à
          l'exactitude des scores IA ou à l'adéquation du service à un usage particulier. Le service est fourni "en l'état".
        </p>
      </Section>

      <Section title="9. Responsabilité">
        <p>
          LeadMatch Immo ne saurait être tenu responsable des dommages indirects (perte de revenus, perte de données,
          atteinte à l'image) résultant de l'utilisation ou de l'impossibilité d'utilisation du service.
          Notre responsabilité directe ne peut excéder le montant des abonnements versés au cours des 3 derniers mois.
        </p>
      </Section>

      <Section title="10. Résiliation">
        <p>
          Vous pouvez résilier votre abonnement à tout moment depuis votre espace compte. La résiliation prend effet à la
          fin de la période de facturation en cours. Vos données sont supprimées 30 jours après la résiliation.
        </p>
        <p>
          Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation des présentes CGU,
          sans remboursement ni préavis.
        </p>
      </Section>

      <Section title="11. Modifications des CGU">
        <p>
          Nous pouvons modifier les présentes CGU à tout moment. Les utilisateurs seront informés par e-mail 30 jours
          avant l'entrée en vigueur des modifications. La poursuite de l'utilisation du service après cette date vaut acceptation.
        </p>
      </Section>

      <Section title="12. Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher
          une solution amiable avant tout recours judiciaire. À défaut, les tribunaux du ressort de Paris seront compétents.
        </p>
        <p className="text-sm text-white/40 mt-4">Dernière mise à jour : mai 2026</p>
      </Section>
    </LegalLayout>
  );
}
