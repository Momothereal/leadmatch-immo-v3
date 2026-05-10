import { LegalLayout, Section } from "./MentionsLegales";

export default function CGV() {
  return (
    <LegalLayout title="Conditions Générales de Vente">
      <p className="text-white/50 text-xs -mt-6 mb-4">En vigueur depuis le 1er mai 2026</p>

      <Section title="1. Objet et champ d'application">
        <p>
          Les présentes Conditions Générales de Vente (CGV) régissent les ventes d'abonnements au service
          <strong> LeadMatch Immo</strong>, logiciel SaaS de scoring IA pour agents immobiliers.
          Elles s'appliquent à tout professionnel (B2B) souscrivant un abonnement.
        </p>
      </Section>

      <Section title="2. Offres et tarifs">
        <p>Les abonnements disponibles sont :</p>
        <ul>
          <li>
            <strong>Standard — 49 € HT/mois</strong> : accès complet à l'outil de matching, import jusqu'à 500 leads,
            scoring IA illimité, 1 utilisateur
          </li>
          <li>
            <strong>Pro — 89 € HT/mois</strong> : toutes les fonctionnalités Standard + priorité de support,
            accès aux nouvelles fonctionnalités en avant-première
          </li>
          <li>
            <strong>Pro annuel — 961,20 € HT/an</strong> (soit 80,10 €/mois, économie de 10 %)
          </li>
        </ul>
        <p>
          Tous les prix sont indiqués hors taxes. La TVA applicable est celle en vigueur au moment de la facturation.
          Les tarifs peuvent être modifiés avec un préavis de 30 jours par e-mail.
        </p>
      </Section>

      <Section title="3. Période d'essai">
        <p>
          Un essai gratuit de <strong>14 jours</strong> est proposé sans engagement et sans carte bancaire requise.
          À l'issue de l'essai, un abonnement payant est nécessaire pour continuer à utiliser le service.
          Aucune facturation automatique ne démarre sans saisie de vos coordonnées bancaires.
        </p>
      </Section>

      <Section title="4. Modalités de paiement">
        <ul>
          <li>Le paiement s'effectue en ligne, par carte bancaire, via <strong>Stripe</strong></li>
          <li>Les abonnements mensuels sont facturés d'avance, le même jour chaque mois</li>
          <li>Les abonnements annuels sont facturés en une fois à la souscription</li>
          <li>En cas d'échec de paiement, un email de relance est envoyé. Après 3 tentatives échouées, l'accès est suspendu</li>
          <li>Une facture est émise automatiquement après chaque prélèvement, téléchargeable depuis le portail Stripe</li>
        </ul>
      </Section>

      <Section title="5. Droit de rétractation">
        <p>
          Conformément à l'article L.221-28 du Code de la consommation, <strong>le droit de rétractation ne s'applique pas</strong>{" "}
          aux services numériques dont l'exécution a commencé avant l'expiration du délai de rétractation, avec l'accord exprès
          de l'utilisateur.
        </p>
        <p>
          Toutefois, si vous n'avez pas utilisé le service durant les 7 premiers jours suivant votre premier abonnement payant,
          vous pouvez demander un remboursement intégral en contactant{" "}
          <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">contact@leadmatch-immo.fr</a>.
        </p>
      </Section>

      <Section title="6. Résiliation et remboursement">
        <ul>
          <li>Résiliation possible à tout moment depuis l'espace compte, sans frais</li>
          <li>La résiliation prend effet à la fin de la période de facturation en cours — aucun remboursement prorata temporis</li>
          <li>Aucun remboursement n'est accordé en cas de résiliation en cours de période, sauf cas exceptionnel apprécié par notre service client</li>
          <li>En cas de résiliation pour manquement grave de notre part, un remboursement au prorata peut être accordé</li>
        </ul>
      </Section>

      <Section title="7. Code promotionnel et parrainage">
        <ul>
          <li>Les codes promo réduisent le prix du premier mois ou d'une période définie, selon les conditions spécifiées sur le code</li>
          <li>Un seul code promo par souscription, non cumulable</li>
          <li>Le parrainage offre 1 mois gratuit au parrain lorsque son filleul souscrit un abonnement payant — cette offre est accordée sous forme d'extension d'abonnement, non monétisable</li>
        </ul>
      </Section>

      <Section title="8. Garanties et niveau de service">
        <p>
          Nous nous engageons à fournir le service avec un niveau de disponibilité cible de 99,5 % (hors maintenances).
          En cas d'interruption prolongée (&gt; 24h consécutives) imputable à notre infrastructure, un avoir équivalent
          au prorata de la période d'interruption sera accordé sur demande.
        </p>
      </Section>

      <Section title="9. Données de facturation">
        <p>
          Conformément à l'article L.123-22 du Code de commerce, les documents comptables relatifs aux ventes sont
          conservés pendant 10 ans.
        </p>
      </Section>

      <Section title="10. Litiges et médiation">
        <p>
          En cas de litige, vous pouvez contacter notre service client à{" "}
          <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">contact@leadmatch-immo.fr</a>.
          À défaut de résolution amiable, vous pouvez recourir à un médiateur de la consommation agréé.
          Les présentes CGV sont soumises au droit français.
        </p>
        <p className="text-sm text-white/40 mt-4">Dernière mise à jour : mai 2026</p>
      </Section>
    </LegalLayout>
  );
}
