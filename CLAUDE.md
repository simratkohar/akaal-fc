# Akaal FC — app d'équipe

Contexte pour Claude Code. Lis ce fichier avant de travailler sur le dépôt.

## Qui et pourquoi
- Utilisateur : Simratpal, capitaine d'Akaal FC (club du Punjab Sports Club France, Bobigny). Débutant en code.
- But : remplacer SportEasy (devenu payant, 9,99 €/mois) par notre propre app, **100 % gratuite**.
- Façon de travailler : **pas à pas**, une seule action à la fois pour l'utilisateur, explications simples, en français.

## Produit
- Application web installable (PWA), mobile-first, en français. Pas d'App Store : les joueurs reçoivent un lien et l'ajoutent à leur écran d'accueil.
- Deux rôles :
  - **Capitaine** (admin) : crée/modifie/supprime les matchs, saisit score, buteurs, passeurs, homme du match, qui a joué ; gère l'effectif et les accès.
  - **Joueur** : compte perso (connexion Google), indique seulement **Présent / Absent** pour les matchs à venir ; consulte tout le reste.
- Les droits doivent être appliqués **côté base (règles Firestore)**, pas seulement en cachant des boutons.

### Matchs
- Type : **uniquement** `Championnat` (FSGT, lundi soir), `Amical`, `Tournoi` (souvent samedi/dimanche). Pas de Coupe, Entraînement ni Autre.
- Championnat : numéro de journée (affiché « FSGT · J1 », « FSGT · J2 »…).
- Format : foot à `7`, `8` ou `11`.
- Domicile/extérieur, date, heure, lieu, adversaire.

### Écrans (barre du bas : Accueil, Calendrier, Stats, Effectif)
- **Accueil** : prochain match (type, format, date, heure, lieu, compte à rebours), boutons Présent/Absent, compteurs présents/absents/sans réponse ; dernier résultat ; bilan saison ; top 3 buteurs.
- **Calendrier** : filtres Tous / Championnat / Amical / Tournoi ; « À venir » et « Terminés ». Carte de match : colonne date (jour, numéro, mois, heure) | les deux équipes l'une sous l'autre (domicile en haut) avec type/journée au-dessus | scores à droite, en vert si victoire, rouge si défaite, gris si nul.
- **Fiche match** : en-tête date + score (Akaal FC vs adversaire), puis onglets **Infos · Présences · Compo · Stats**.
  - Infos : type, format, domicile/extérieur, heure, lieu.
  - Présences : présents / absents / sans réponse, boutons Présent/Absent.
  - Compo : voir ci-dessous.
  - Stats : buts (buteur + passeur, CSC possible), homme du match, qui a joué.
  - Pas d'onglet Forum/chat : l'équipe utilise WhatsApp.
- **Stats** : filtre par compétition ; V/N/D, buts pour/contre, différence ; classements Buts / Passes / Homme du match / Matchs joués.
- **Effectif** : par poste, numéro, capitaine « C », mini-stats ; fiche joueur.
- **Connexion** : écusson + « Se connecter avec Google ».
- **Profil / photo** : chaque joueur peut changer sa photo de profil (avatar rond + bouton appareil photo).

### Réglages capitaine (menu « Plus » / « Réglages », visible seulement par le capitaine)
- **Lieux enregistrés** : liste des stades/gymnases (nom, adresse, lien Google Maps facultatif). Ajouter / modifier / supprimer.
- **Adversaires** : liste des équipes adverses (nom, logo facultatif compressé comme les photos). Ajouter / modifier / supprimer.
- Dans le formulaire « Nouveau match », lieu et adversaire se choisissent dans ces listes (avec possibilité d'en créer un nouveau directement depuis le formulaire). Dans la fiche match, le lieu ouvre Google Maps.
- Données : collections `lieux` {nom, adresse, maps} et `adversaires` {nom, logo}, écrites par le capitaine ; `matchs.lieu` et `matchs.adversaire` deviennent des ids.

### Autres réglages capitaine (repris de SportEasy, sauf « Gestion des tâches » et « Abonnement »)
- **Paiements** : suivi des cotisations / frais (ex. cotisation saison, inscription tournoi) : montant, joueurs concernés, statut payé / pas payé coché par le capitaine. **Aucun paiement en ligne** (suivi seulement, 0 €). Chaque joueur voit ce qu'il doit.
- **Détails de l'équipe** : nom, logo, couleurs, saison en cours, championnat (FSGT).
- **Votes et notes du match** : après un match terminé, chaque joueur qui a joué vote pour l'homme du match et peut noter ses coéquipiers sur 10. Fermeture des votes au bout de 48 h (réglable). Le capitaine choisit si l'homme du match = résultat du vote ou son propre choix. Notes moyennes visibles dans les stats.
- **Membres concernés** : par type de match, quels joueurs sont convoqués par défaut (tout l'effectif, ou une sélection).
- **Gestion des présences** : date limite de réponse (ex. la veille à 20 h), nombre max de joueurs, le capitaine peut changer la réponse d'un joueur.
- Données : `paiements` {libelle, montant, joueurs: {id: paye(bool)}}, `votes` doc `<matchId>_<joueurId>` {hommeDuMatch, notes: {joueurId: n}}, réglages dans un doc `equipe/config`.

### Compo (composition d'équipe), par match
- Inspirée de SportEasy (captures fournies par l'utilisateur).
- Vide : illustration terrain + « Pas de composition » + bouton « Créer une compo » (capitaine).
- Avertissement si pas assez de présents : « Il manque X joueur(s) (sur N) pour une compo complète » (N = 7, 8 ou 11 selon le format).
- Éditeur (capitaine uniquement) : nom de la compo, choix de la **formation** (liste selon le format), terrain vertical avec emplacements (gardien en bas), on touche un emplacement → on choisit parmi les joueurs **marqués présents** ; zone **Remplaçants** sous le terrain ; bouton Enregistrer.
- Formations : à 7 → 2-3-1, 3-2-1, 3-1-2, 2-2-2 ; à 8 → 2-3-2, 3-3-1, 3-2-2 ; à 11 → 4-4-2, 4-3-3, 3-5-2, 4-2-3-1 (gardien en plus).
- Les joueurs voient la compo en lecture seule (avatars/photos + nom + numéro sur le terrain).
- Données : champ `compo` dans le document `matchs` : `{nom, formation, postes: {"<slot>": joueurId}, remplacants: [joueurIds]}`.

### Photos de profil
- Par défaut : la photo du compte Google (`user.photoURL` fourni par Firebase Auth).
- Photo perso : choisie depuis le téléphone, recadrée en carré et compressée côté navigateur (canvas, ~256 px, JPEG ~0,7 → ~30 Ko), stockée en data URL dans le champ `photo` du document `joueurs`.
- **Ne pas utiliser Firebase Storage** : il exige l'offre Blaze (payante) pour les nouveaux projets.
- Règle : un joueur ne modifie que sa propre photo ; le capitaine peut toutes les modifier.
- Avatars affichés partout : effectif, classements, présences, fiche match.

## Stack (décidée, 0 €)
- HTML/CSS/JS simple, **sans framework, sans build**.
- Code et hébergement : **GitHub Pages** sur ce dépôt public (`simratkohar/akaal-fc`), URL `https://simratkohar.github.io/akaal-fc/`.
- Données et connexion : **Firebase, offre Spark** (gratuite, sans carte bancaire) — Firestore + Authentication Google. **Ne jamais passer en offre Blaze.**

## Modèle de données (Firestore)
| Collection | Champs | Écrit par |
|---|---|---|
| `joueurs` | nom, numero, poste, uid (compte lié), role (`capitaine`/`joueur`), photo (data URL, facultatif) | capitaine ; le joueur pour sa propre `photo` |
| `matchs` | type, format, date (ISO), lieu, adversaire, domicile (bool), scoreNous, scoreEux, joue (bool), hommeDuMatch, ontJoue [ids joueurs] | capitaine |
| `buts` | match, buteur (id joueur ou `csc`), passeur (id ou null) | capitaine |
| `presences` | doc id `<matchId>_<joueurId>` : match, joueur, reponse (`present`/`absent`) | le joueur lui-même, ou le capitaine |

Les stats saison sont **calculées** à partir de ces collections, jamais saisies deux fois.

## Identité visuelle
- Logo : `assets/logo.png` — écusson rond noir et or, tête de lion dorée, Khanda, lauriers, « EST. 2019 », « FRANCE », fin liseré bleu-blanc-rouge.
- Maillot : `assets/maillot.png` — rayures diagonales noir/blanc, dos noir, « AKAAL FC » et numéro blancs liserés or.
- Palette cible : noir profond `#0B0B0B`, or `#C9A24A` / `#E6C66A`, blanc cassé `#F5F1E6`. Mode sombre par défaut.
- Maquettes en cours sur Google Stitch : quand l'utilisateur les fournit, les suivre.

## État actuel
- `index.html` : V1 **démo** fonctionnelle, tout en un fichier, données fictives en mémoire (objet `db`), tous les écrans et formulaires capitaine. Bouton en haut à droite = bascule capitaine / vue joueur (démo uniquement).
- Couleurs provisoires bleu marine/or → à passer en noir/or avec le logo.

## Fonctionnalités en plus (validées par l'utilisateur)
- **Rappels / notifications push** (PWA, service worker + Firebase Cloud Messaging, gratuit) : nouveau match créé, relance la veille aux joueurs sans réponse, résultat publié.
- **Bilan des présences** : taux de présence par joueur sur la saison (onglet Stats).
- **Fiche joueur enrichie** : forme sur les 5 derniers matchs (V/N/D), note moyenne (votes), taux de présence, badges (premier but, triplé, 10/20/50 buts, 10/20/50 matchs, homme du match x5…).
- **Face-à-face** : historique contre chaque adversaire (V/N/D, buts) dans la fiche adversaire et la fiche match.
- **Classement du championnat FSGT** : tableau du groupe saisi par le capitaine + lien vers le classement officiel (voir ci-dessous).
- **Bilan de fin de saison** façon « Wrapped » : meilleur buteur, meilleur passeur, plus gros score, joueur le plus présent, homme du match le plus voté…
- **Archives par saison** : chaque match/stat est rattaché à une saison (`saison: "2026-2027"`) ; sélecteur de saison dans Stats.
- **À tester plus tard** : visuel du résultat à partager sur Instagram (image générée côté navigateur, noir/or, score + buteurs + homme du match).
- **Refusé** : ajout au calendrier du téléphone, covoiturage, cartons/suspensions, forum.

### Classement FSGT
- Source officielle : https://www.footfsgtidf.org/ → Football à 7 → 93 Groupe 1 (groupe d'Akaal FC).
- Le site **interdit les robots (robots.txt)** : pas de récupération automatique (pas de scraping, pas de GitHub Action qui lit le site).
- À faire : (1) bouton « Classement officiel » qui ouvre https://www.footfsgtidf.org/ (l'adresse ne change pas selon la page, pas de lien direct vers le groupe) avec l'indication « Football à 7 → 93 Groupe 1 » ; (2) tableau saisi par le capitaine (équipe, points, joués, V, N, D, buts pour/contre), Akaal FC mis en avant ; collection `classement` ou doc `equipe/classement`.
- Automatique seulement si la FSGT IDF donne son accord ou propose un flux.

## Prochaines étapes
1. Lire les maquettes Google Stitch fournies par l'utilisateur (captures et/ou code exporté) : c'est la référence visuelle. Les ranger dans `maquettes/`.
2. Restructurer le code (fichiers séparés : `index.html`, `css/`, `js/`), toujours sans framework ni build, et appliquer le design Stitch (noir/or, logo).
3. Rendre l'app installable (PWA) : `manifest.json` + icônes à partir de `assets/logo.png` + service worker.
4. Créer le projet Firebase avec l'utilisateur (le guider écran par écran, offre Spark uniquement).
5. Remplacer l'objet `db` de démo par Firestore + Auth Google ; écrire et tester les règles de sécurité (rôles capitaine / joueur).
6. Ajouter les fonctionnalités dans cet ordre : matchs + présences → résultats + stats → compo → réglages capitaine (lieux, adversaires, présences, membres) → votes et notes → paiements → classement FSGT → fiche joueur enrichie, face-à-face, archives, bilan de saison → notifications push.
7. Activer GitHub Pages (Settings → Pages → branche `main`, dossier `/`) et tester sur iPhone (Safari → Partager → Sur l'écran d'accueil).
8. Saisir le vrai effectif et le calendrier, partager le lien à l'équipe.
