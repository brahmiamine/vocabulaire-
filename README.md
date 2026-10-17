# Mot à Mot — Ton français, chaque jour

Application **React + Vite**, mobile-first, installable en **PWA** sur Android et iPhone, et déployable sur **GitHub Pages**. Les mots peuvent rester **en local** ou être synchronisés vers une base **Supabase privée** (auth par e-mail et RLS).

## Pourquoi ce design pédagogique ?

Les méthodes à plus forte utilité pour la mémoire incluent la pratique de récupération ("retrouver le mot sans lire") et l'espacement des révisions. Pour le français B1/B2, nous donnons aussi la priorité à la **production** : inventer une phrase personnelle et essayer de la prononcer.
- Dunlosky et al. (2013), revue de 10 techniques d'apprentissage : https://doi.org/10.1177/1529100612453266
- Kim & Webb (2022), méta-analyse de l'espacement en langue seconde : https://doi.org/10.1111/lang.12479
- Conseil de l'Europe, CECRL volume complémentaire : https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-companion-volume-and-its-language-versions

**Note scientifique :** l'ordonnanceur inclus est une variante transparente et simplifiée de SM-2, et non l'algorithme FSRS. Les délais sont des heuristiques, pas une promesse de mémorisation parfaite.

## Fonctionnalités

- Carnet de mots et expressions avec définition en français, traduction en **arabe littéraire**, phrase personnelle, catégorie, source et date d'apprentissage.
- Recherche, filtres, ajout, modification et archivage.
- Pack de démarrage **optionnel** de 30 expressions utiles, sans doublons.
- Rappel actif : afficher d'abord le sens ou le mot, deviner/écrire, puis dévoiler la réponse.
- Répétition espacée sur 4 niveaux : À revoir (10 min), Difficile, Bien, Facile.
- Text-to-speech français (API du navigateur), entraînement oral via reconnaissance vocale **lorsqu'elle est disponible**, saisie alternative.
- Suivi des progrès, historique des révisions, série quotidienne, objectif indicatif de 10 rappels.
- Import CSV/JSON, export JSON pour sauvegarde. Données locales utilisables **hors connexion** avec PWA.
- Connexion Supabase optionnelle par e-mail et isolation stricte des données par utilisateur (RLS).
- Responsive avec navigation basse sur mobile, thème clair et installation PWA.

**Limites volontaires :** la reconnaissance vocale transcrit et détecte le terme mais **ne juge pas la grammaire ou la qualité de la phrase** ; elle dépend du navigateur, des permissions et parfois d'un service réseau. En mode cloud, l'écriture hors ligne n'est pas garantie : exporter une sauvegarde ou utiliser le mode local tant qu'il n'y a pas de réseau. Les données locales ne sont pas automatiquement transférées en cloud : un bouton permet de les importer.

## Démarrer en local

Exige Node.js 20.19+ ou 22.12+.

```bash
npm install
cp .env.example .env.local
npm run dev
npm test
npm run build
```

Sans variables Supabase, l'application fonctionne **localement** via `localStorage`. Ce stockage est propre au navigateur et peut disparaître si les données du navigateur sont effacées ; exporter régulièrement du JSON.

## Configurer un nouveau projet Supabase (recommandé)

**Ne pas réutiliser les bases d'autres applications sans décision explicite.**

1. Créer un projet Supabase dédié, puis appliquer `supabase/migrations/20261017_vocabulary.sql` via l'éditeur SQL ou une migration.
2. Sous Authentication > Providers, activer Email (lien de connexion).
3. Sous Authentication > URL Configuration, définir comme **Site URL** : `https://brahmiamine.github.io/vocabulaire-/`, et ajouter cette URL aux **Redirect URLs**.
4. Récupérer l'URL de projet et une **publishable key** (`sb_publishable_...`) ; ne jamais utiliser une `service_role`/secret key dans un frontend.
5. Localement, créer `.env.local` :
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```
6. Pour GitHub Actions, ouvrir **Settings → Secrets and variables → Actions → Variables**, et ajouter `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` avec leurs valeurs **publiables**. Un commit vers `main` déclenche un nouveau build.

Les autorisations RLS restrictives sont présentes dans le SQL. Ne pas désactiver RLS. Tester avec deux comptes différents avant d'importer des données sensibles.

## Déployer sur GitHub Pages

1. Ouvrir le dépôt GitHub → **Settings → Pages** → **Build and deployment → Source : GitHub Actions**.
2. Déclencher le workflow `Deploy PWA` depuis Actions, ou pousser vers `main`.
3. L'URL du site est **https://brahmiamine.github.io/vocabulaire-/** (accessible une fois Pages activé et le déploiement réussi).
4. Sur Android (Chrome), ouvrir l'URL puis « Installer l'application » / « Ajouter à l'écran d'accueil ». Sur iPhone (Safari), Partager → Ajouter à l'écran d'accueil.

Le chemin de base Vite est `/vocabulaire-/`, conformément à la [documentation Vite](https://vite.dev/guide/static-deploy.html). Les liens d'authentification nécessitent un Redirect URL valide côté Supabase.

## CSV accepté

```csv
term,meaning,translation_ar,example,category,source,learned_on
tiquer,Se montrer surpris,يستغرب,J'ai tiqué en voyant la facture,Quotidien,Conversation,2026-10-16
```

Le champ `term` est obligatoire. Pour le JSON, utiliser une liste d'objets contenant au moins `term`. Un champ `meaning` est conseillé.

## Vérification

```bash
npm test
npm run build
```

Le workflow GitHub Actions exécute les tests et le build avant déploiement.

## Sécurité et données

Le déploiement statique et les fichiers front sont **publics** ; seule une clé publique peut y figurer. Toutes les entrées utilisateur se sauvegardent en local en mode hors connexion, ou via des requêtes authentifiées dans le projet Supabase lorsque connecté. Les tables `vocab_words` et `vocab_reviews` ont des politiques RLS basées sur `auth.uid() = user_id`.

Aucun suivi publicitaire ni service IA payant. La synthèse vocale et la reconnaissance vocale dépendent du navigateur ; la reconnaissance vocale peut transmettre l'audio à un service du navigateur.

## Roadmap

- Production orale avec commentaires grammaticaux validés par l'apprenant (service IA et protections de données à concevoir).
- Synchronisation cloud hors ligne avec file d'attente et résolution de conflits.
- Quiz contextualisés, collocations et corpus de lecture personnels.
