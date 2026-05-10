import { LegalLayout, Section } from "./MentionsLegales";

export default function CGU() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation">
      <p className="text-white/50 text-xs -mt-6 mb-4">En vigueur depuis le 1er mai 2026 — Acceptation obligatoire à la création du compte.</p>

      <Section title="1. Objet et acceptation">
        <p>
          Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme
          <strong> LeadMatch Immo</strong> (ci-après « la Plateforme »), logiciel SaaS de scoring IA et de mise en relation
          dans le secteur immobilier, éditée par Mohammed Fofana (ci-après « l'Éditeur »).
        </p>
        <p>
          <strong>En créant un compte, l'Utilisateur accepte pleinement et sans réserve les présentes CGU ainsi que la
          Politique de confidentialité associée.</strong> Si l'Utilisateur n'accepte pas ces conditions, il ne doit pas
          créer de compte ni utiliser la Plateforme.
        </p>
        <p>
          L'Utilisateur certifie agir à titre professionnel (B2B) dans le cadre de son activité d'agent immobilier,
          de mandataire, de promoteur ou de tout autre professionnel du secteur immobilier.
        </p>
      </Section>

      <Section title="2. Description du service et modèle économique">
        <p>
          LeadMatch Immo est une plateforme multi-services dont le modèle économique repose sur plusieurs piliers,
          que l'Utilisateur reconnaît avoir compris et acceptés :
        </p>
        <ul>
          <li>
            <strong>Abonnement SaaS :</strong> accès au logiciel de scoring IA, d'import de leads et de matching
            bien/prospect, sur la base d'un abonnement mensuel ou annuel.
          </li>
          <li>
            <strong>Marketplace de leads :</strong> la Plateforme peut mettre en relation des Utilisateurs disposant
            de leads qualifiés avec d'autres professionnels de l'immobilier recherchant des prospects, sous réserve
            du consentement exprès des prospects concernés.
          </li>
          <li>
            <strong>Partenariats et référencements :</strong> la Plateforme peut percevoir des commissions
            dans le cadre de partenariats avec des courtiers en crédit, compagnies d'assurance, notaires, promoteurs
            immobiliers, ou tout autre prestataire du secteur, lorsqu'une mise en relation est effectuée.
          </li>
          <li>
            <strong>Données de marché agrégées et anonymisées :</strong> la Plateforme peut produire et commercialiser
            des rapports, analyses et indicateurs de marché basés sur des données agrégées et anonymisées issues
            de l'activité globale de la Plateforme. Ces données ne permettent pas d'identifier un utilisateur ou
            un prospect spécifique.
          </li>
          <li>
            <strong>Services premium :</strong> fonctionnalités avancées, modules additionnels ou accès API
            susceptibles d'être proposés en supplément de l'abonnement de base.
          </li>
        </ul>
      </Section>

      <Section title="3. Données importées par l'Utilisateur — responsabilités">
        <p>
          L'Utilisateur est <strong>seul responsable de traitement</strong> au sens du RGPD pour toutes les données
          personnelles qu'il importe sur la Plateforme (leads, prospects, contacts acheteurs/vendeurs).
          LeadMatch Immo agit en qualité de <strong>sous-traitant</strong> (art. 28 RGPD).
        </p>
        <p>En important des données sur la Plateforme, l'Utilisateur garantit :</p>
        <ul>
          <li>Disposer d'une base légale valide (consentement, intérêt légitime, contrat) pour traiter ces données</li>
          <li>Avoir informé les personnes concernées de leurs droits RGPD</li>
          <li>Ne pas importer de données de mineurs de moins de 18 ans</li>
          <li>Ne pas importer de données sensibles (santé, origine, convictions…)</li>
          <li>Être en conformité avec les règles de prospection commerciale (opt-in ou opt-out selon le contexte)</li>
        </ul>
        <p>
          L'Éditeur se réserve le droit de suspendre l'accès de tout Utilisateur dont les pratiques de collecte
          seraient manifestement illicites, sans préjudice de toute action en responsabilité.
        </p>
      </Section>

      <Section title="4. Consentement relatif aux données de la Plateforme">
        <p>
          En utilisant la Plateforme, l'Utilisateur accepte que LeadMatch Immo utilise les données de son activité
          sur la Plateforme aux fins suivantes, dans les conditions précisées dans la Politique de confidentialité :
        </p>
        <ul>
          <li>
            <strong>Amélioration du service :</strong> analyse des usages pour améliorer les algorithmes de scoring
            et les fonctionnalités (données traitées de manière pseudonymisée)
          </li>
          <li>
            <strong>Statistiques de marché :</strong> production d'indicateurs agrégés (volumes de leads par zone
            géographique, taux de conversion moyens, tendances de prix…) utilisés à des fins commerciales et
            éditoriales, sans jamais permettre l'identification d'un Utilisateur ou d'un prospect spécifique
          </li>
          <li>
            <strong>Communication de la Plateforme :</strong> mentions anonymisées de résultats représentatifs
            dans les supports marketing (ex : « nos utilisateurs scorent en moyenne X leads par semaine »)
          </li>
        </ul>
        <p>
          L'Utilisateur peut retirer son consentement aux traitements non essentiels à tout moment en contactant
          <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline ml-1">contact@leadmatch-immo.fr</a>.
          Ce retrait ne remet pas en cause la licéité des traitements effectués avant le retrait.
        </p>
      </Section>

      <Section title="5. Marketplace de leads — conditions spécifiques">
        <p>
          La fonction de mise en relation de leads entre professionnels (ci-après « Marketplace ») est soumise aux
          conditions supplémentaires suivantes :
        </p>
        <ul>
          <li>
            <strong>Consentement du prospect obligatoire :</strong> un lead ne peut être partagé ou vendu via la
            Marketplace qu'avec le consentement exprès et documenté du prospect concerné. L'Utilisateur qui publie
            un lead sur la Marketplace certifie disposer de ce consentement et en conserve la preuve.
          </li>
          <li>
            <strong>Qualification minimale :</strong> tout lead mis en vente doit être qualifié (projet identifié,
            coordonnées vérifiées, chronologie du projet renseignée).
          </li>
          <li>
            <strong>Commission :</strong> LeadMatch Immo perçoit une commission sur chaque transaction réalisée via
            la Marketplace, dont le taux est précisé dans les conditions tarifaires en vigueur.
          </li>
          <li>
            <strong>Garantie :</strong> l'acheteur d'un lead dispose d'un délai de 48h pour signaler un lead invalide
            (coordonnées erronées, projet inexistant). Tout remboursement est soumis à vérification.
          </li>
          <li>
            <strong>Responsabilité :</strong> LeadMatch Immo n'est pas responsable de la qualité des leads mis en
            vente par les Utilisateurs ni du résultat commercial des mises en relation.
          </li>
        </ul>
      </Section>

      <Section title="6. Partenariats et mises en relation commerciales">
        <p>
          La Plateforme peut proposer à l'Utilisateur ou à ses prospects (avec leur consentement) d'être mis en
          relation avec des partenaires commerciaux (courtiers, assureurs, notaires, déménageurs, diagnostiqueurs…).
        </p>
        <p>
          Ces mises en relation peuvent donner lieu au versement d'une commission à LeadMatch Immo par le partenaire.
          L'Utilisateur en est informé par la présente clause et accepte ce modèle économique.
        </p>
        <p>
          Aucune mise en relation d'un prospect avec un partenaire tiers ne sera effectuée sans le consentement
          préalable et explicite du prospect concerné.
        </p>
      </Section>

      <Section title="7. Intelligence artificielle — limites et responsabilité">
        <p>
          Le scoring IA est fourni à titre d'aide à la décision. Les résultats constituent une recommandation
          algorithmique et ne remplacent pas le jugement professionnel de l'agent.
        </p>
        <p>
          LeadMatch Immo ne garantit pas l'exactitude, l'exhaustivité ou l'adéquation des scores produits.
          L'Éditeur décline toute responsabilité quant aux décisions commerciales prises sur la base des
          recommandations de l'IA.
        </p>
      </Section>

      <Section title="8. Propriété intellectuelle">
        <p>
          La Plateforme, ses composants, algorithmes, design et marque sont la propriété exclusive de l'Éditeur.
          L'abonnement confère un droit d'usage personnel, non exclusif et non transférable.
        </p>
        <p>
          <strong>Vos données restent votre propriété :</strong> les leads et biens que vous importez vous
          appartiennent. Vous pouvez les exporter en format standard (CSV) ou demander leur suppression à tout moment.
        </p>
        <p>
          En revanche, les scores, analyses et recommandations IA générés par la Plateforme à partir de vos données
          sont la propriété intellectuelle de LeadMatch Immo.
        </p>
      </Section>

      <Section title="9. Compte utilisateur et sécurité">
        <ul>
          <li>Un abonnement = un utilisateur principal (partage de compte interdit)</li>
          <li>Vous êtes responsable de la confidentialité de vos identifiants</li>
          <li>Toute activité depuis votre compte vous est imputée</li>
          <li>Signalez immédiatement toute compromission à <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">contact@leadmatch-immo.fr</a></li>
          <li>Les comptes inactifs depuis plus de 12 mois peuvent être archivés après notification</li>
        </ul>
      </Section>

      <Section title="10. Comportements interdits">
        <p>Il est strictement interdit d'utiliser la Plateforme pour :</p>
        <ul>
          <li>Importer des données obtenues illicitement (scraping non consenti, achat de fichiers douteux…)</li>
          <li>Revendre l'accès à la Plateforme à des tiers</li>
          <li>Tenter de contourner les protections techniques ou d'accéder à des données d'autres Utilisateurs</li>
          <li>Publier sur la Marketplace des leads fictifs ou non vérifiés</li>
          <li>Utiliser la Plateforme à des fins de concurrence déloyale envers l'Éditeur</li>
          <li>Saturer les serveurs (DDoS, scraping massif de la Plateforme…)</li>
        </ul>
        <p>
          Tout manquement peut entraîner la suspension immédiate du compte, sans remboursement, et éventuellement
          des poursuites judiciaires.
        </p>
      </Section>

      <Section title="11. Disponibilité, modifications et résiliation">
        <ul>
          <li>Disponibilité cible : 99,5 % (hors maintenances)</li>
          <li>Les CGU peuvent être modifiées avec un préavis de 30 jours par e-mail</li>
          <li>La poursuite de l'utilisation après modification vaut acceptation</li>
          <li>Résiliation possible à tout moment — effet à fin de période de facturation</li>
          <li>L'Éditeur peut résilier tout compte en cas de violation, sans remboursement</li>
        </ul>
      </Section>

      <Section title="12. Responsabilité et limitation">
        <p>
          La responsabilité de LeadMatch Immo ne peut excéder le montant des abonnements versés sur les 3 derniers
          mois. L'Éditeur n'est pas responsable des dommages indirects (perte de revenus, de données, d'image).
        </p>
      </Section>

      <Section title="13. Droit applicable">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties rechercheront
          une solution amiable avant tout recours judiciaire. À défaut, les tribunaux de Paris seront compétents.
        </p>
        <p className="text-sm text-white/40 mt-4">Dernière mise à jour : mai 2026</p>
      </Section>
    </LegalLayout>
  );
}
