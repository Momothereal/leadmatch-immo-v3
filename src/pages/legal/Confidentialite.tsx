import { LegalLayout, Section } from "./MentionsLegales";

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité & utilisation des données">
      <p className="text-white/50 text-xs -mt-6 mb-4">
        Cette politique vous informe précisément sur toutes les utilisations de vos données, y compris commerciales.
        Votre consentement est recueilli à la création du compte.
      </p>

      <Section title="1. Qui sommes-nous ?">
        <p>
          <strong>LeadMatch Immo</strong> est édité par Mohammed Fofana (France).
          Contact DPO / données personnelles :{" "}
          <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">
            contact@leadmatch-immo.fr
          </a>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p><strong>A. Données de compte (obligatoires)</strong></p>
        <ul>
          <li>Adresse e-mail, mot de passe (haché, jamais stocké en clair)</li>
          <li>Informations professionnelles renseignées volontairement (agence, ville, spécialité)</li>
        </ul>
        <p><strong>B. Données métier importées par l'Utilisateur</strong></p>
        <ul>
          <li>Fichiers de leads et de prospects (nom, contact, projet immobilier, budget, localisation…)</li>
          <li>Biens immobiliers (adresse, caractéristiques, prix…)</li>
          <li>Résultats de scoring et d'analyse IA générés par la Plateforme</li>
        </ul>
        <p><strong>C. Données d'usage (collectées automatiquement)</strong></p>
        <ul>
          <li>Logs de connexion, adresse IP, navigateur, appareil</li>
          <li>Interactions avec la Plateforme (pages visitées, actions réalisées, fonctionnalités utilisées)</li>
          <li>Performances et métriques d'utilisation (nombre de leads scorés, taux de match…)</li>
        </ul>
        <p><strong>D. Données de paiement</strong></p>
        <ul>
          <li>Gérées exclusivement par Stripe (certifié PCI DSS niveau 1)</li>
          <li>LeadMatch Immo ne stocke aucune donnée bancaire directement</li>
          <li>Nous conservons uniquement : montant, date, statut de paiement, identifiant de transaction</li>
        </ul>
      </Section>

      <Section title="3. Finalités et bases légales de traitement">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse mt-2">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 pr-4 text-white/80 font-semibold">Finalité</th>
                <th className="text-left py-2 pr-4 text-white/80 font-semibold">Base légale (RGPD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {[
                ["Fourniture du service SaaS (scoring, matching)", "Exécution du contrat"],
                ["Gestion de l'abonnement et facturation", "Exécution du contrat + obligation légale"],
                ["Emails transactionnels (confirmation, réinitialisation)", "Exécution du contrat"],
                ["Amélioration des algorithmes IA (données pseudonymisées)", "Intérêt légitime"],
                ["Statistiques de marché agrégées et anonymisées", "Intérêt légitime"],
                ["Mise en relation via la Marketplace de leads", "Consentement explicite"],
                ["Partenariats avec prestataires immobiliers", "Consentement explicite"],
                ["Communications marketing de LeadMatch Immo", "Consentement (opt-in)"],
                ["Prévention de la fraude et sécurité", "Intérêt légitime + obligation légale"],
                ["Conservation des données comptables", "Obligation légale (10 ans)"],
              ].map(([f, b]) => (
                <tr key={f}>
                  <td className="py-2 pr-4 text-white/70">{f}</td>
                  <td className="py-2 text-white/50 italic">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Utilisation commerciale des données — transparence totale">
        <p>
          LeadMatch Immo a un modèle économique multi-sources. Voici précisément comment vos données peuvent
          contribuer à ces revenus, dans le respect du RGPD :
        </p>

        <p className="font-semibold text-white/90 mt-3">4.1 Données agrégées et anonymisées (sans votre identification)</p>
        <p>
          Nous produisons des <strong>rapports de marché</strong> (tendances de prix, volumes de transactions,
          mobilité géographique des acheteurs, délais de vente moyens par zone…) à partir des données
          agrégées de l'ensemble de la Plateforme. Ces rapports sont <strong>commercialisés</strong> auprès de
          promoteurs, foncières, banques, institutions ou médias spécialisés.
          Ces analyses ne contiennent aucune donnée permettant d'identifier un Utilisateur ou un prospect.
        </p>

        <p className="font-semibold text-white/90 mt-3">4.2 Marketplace de leads entre professionnels (avec votre consentement)</p>
        <p>
          Si vous activez la fonctionnalité Marketplace, vos leads qualifiés peuvent être proposés à d'autres
          agents immobiliers partenaires. <strong>Cette fonctionnalité ne s'active que sur votre initiative
          explicite, lead par lead</strong>, et uniquement si le prospect a donné son consentement à être
          contacté par d'autres professionnels. LeadMatch Immo perçoit une commission sur chaque transaction.
        </p>

        <p className="font-semibold text-white/90 mt-3">4.3 Mise en relation avec partenaires (opt-in prospect)</p>
        <p>
          Avec le consentement explicite d'un prospect, LeadMatch Immo peut lui proposer d'être contacté par
          des partenaires (courtiers en crédit, assureurs, notaires, déménageurs…). Cette mise en relation
          génère une commission versée à LeadMatch Immo par le partenaire.
          <strong> Aucune donnée de prospect n'est transmise sans son consentement préalable documenté.</strong>
        </p>

        <p className="font-semibold text-white/90 mt-3">4.4 Amélioration de l'IA (pseudonymisation)</p>
        <p>
          Les interactions sur la Plateforme (scores générés, résultats de matching, feedback Utilisateur)
          alimentent l'amélioration de nos modèles IA sous forme pseudonymisée. Ces données ne sont jamais
          partagées à l'extérieur sous une forme identifiante.
        </p>
      </Section>

      <Section title="5. Destinataires des données">
        <p>Vos données peuvent être partagées avec :</p>
        <ul>
          <li><strong>Supabase</strong> — hébergement base de données (UE) — sous-traitant RGPD contractualisé</li>
          <li><strong>Netlify</strong> — hébergement frontend — sous-traitant</li>
          <li><strong>Stripe</strong> — paiements (PCI DSS niveau 1) — sous-traitant</li>
          <li><strong>Anthropic (Claude AI)</strong> — analyse IA des leads (données transmises sans identification directe) — sous-traitant</li>
          <li><strong>Partenaires commerciaux</strong> — uniquement avec votre consentement ou celui du prospect concerné</li>
          <li><strong>Autorités compétentes</strong> — sur réquisition judiciaire ou légale</li>
        </ul>
        <p><strong>Vos données ne sont jamais vendues à des tiers à des fins de ciblage publicitaire.</strong></p>
      </Section>

      <Section title="6. Durée de conservation">
        <ul>
          <li><strong>Compte actif :</strong> pendant toute la durée de l'abonnement + 30 jours post-résiliation</li>
          <li><strong>Leads et biens importés :</strong> supprimés 30 jours après la résiliation ou sur demande</li>
          <li><strong>Données de facturation :</strong> 10 ans (Code de commerce français)</li>
          <li><strong>Logs de sécurité :</strong> 12 mois</li>
          <li><strong>Données agrégées anonymisées :</strong> conservation illimitée (non personnelles)</li>
        </ul>
      </Section>

      <Section title="7. Vos droits RGPD">
        <p>Vous disposez des droits suivants, exerçables à tout moment :</p>
        <ul>
          <li><strong>Accès :</strong> obtenir une copie de toutes vos données</li>
          <li><strong>Rectification :</strong> corriger des données inexactes</li>
          <li><strong>Effacement :</strong> supprimer votre compte et toutes vos données</li>
          <li><strong>Portabilité :</strong> recevoir vos données en format CSV/JSON</li>
          <li><strong>Opposition :</strong> vous opposer aux traitements basés sur l'intérêt légitime</li>
          <li><strong>Retrait du consentement :</strong> révoquer à tout moment un consentement donné (sans rétroactivité)</li>
          <li><strong>Limitation :</strong> restreindre certains traitements</li>
        </ul>
        <p>
          Pour exercer vos droits :{" "}
          <a href="mailto:contact@leadmatch-immo.fr" className="text-blue-400 hover:underline">
            contact@leadmatch-immo.fr
          </a>{" "}
          — réponse sous 30 jours. Réclamation possible auprès de la{" "}
          <a href="https://www.cnil.fr" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">
            CNIL
          </a>.
        </p>
      </Section>

      <Section title="8. Sécurité">
        <ul>
          <li>Chiffrement TLS en transit (HTTPS)</li>
          <li>Mots de passe hachés (bcrypt via Supabase Auth)</li>
          <li>Isolation des données par utilisateur (Row Level Security PostgreSQL)</li>
          <li>Accès production restreint au personnel autorisé</li>
          <li>Sauvegardes chiffrées quotidiennes</li>
          <li>Notification en cas de violation de données dans les 72h (art. 33 RGPD)</li>
        </ul>
      </Section>

      <Section title="9. Cookies et traceurs">
        <ul>
          <li><strong>Cookie de session</strong> (Supabase Auth) — strictement nécessaire, expire après 7 jours</li>
          <li><strong>Préférences UI</strong> — localStorage, aucun tiers</li>
          <li><strong>Analytique</strong> — si activé, données anonymisées sans cookie tiers</li>
        </ul>
        <p>Aucun cookie publicitaire tiers sans consentement explicite.</p>
      </Section>

      <Section title="10. Modifications">
        <p>
          Toute modification significative est notifiée par e-mail 30 jours avant son entrée en vigueur.
          La poursuite de l'utilisation vaut acceptation.
        </p>
        <p className="text-sm text-white/40 mt-4">Dernière mise à jour : mai 2026</p>
      </Section>
    </LegalLayout>
  );
}
