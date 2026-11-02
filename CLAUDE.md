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

## Prochaines étapes
1. Appliquer le design (noir/or, logo, maquettes Stitch).
2. Rendre l'app installable : `manifest.json` + icônes à partir du logo + service worker simple.
3. Créer le projet Firebase avec l'utilisateur (le guider écran par écran).
4. Remplacer l'objet `db` par Firestore + Auth Google ; écrire les règles de sécurité.
5. Activer GitHub Pages (Settings → Pages → branche `main`, dossier `/`).
6. Saisir le vrai effectif et le calendrier, partager le lien à l'équipe.
7. Plus tard (V2) : notifications de rappel, cartons, classement du championnat.
