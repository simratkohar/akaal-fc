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
- Type : `Championnat FSGT` (lundi soir), `Amical`, `Tournoi`, `Coupe` (souvent samedi/dimanche).
- Format : foot à `7`, `8` ou `11`.
- Domicile/extérieur, date, heure, lieu, adversaire.

### Écrans (barre du bas : Accueil, Calendrier, Stats, Effectif)
- **Accueil** : prochain match (type, format, date, heure, lieu, compte à rebours), boutons Présent/Absent, compteurs présents/absents/sans réponse ; dernier résultat ; bilan saison ; top 3 buteurs.
- **Calendrier** : filtres par type ; « À venir » et « Résultats » groupés par mois.
- **Fiche match** : score, buts (buteur + passeur, CSC possible), homme du match, qui a joué ; pour un match à venir : présents/absents/sans réponse.
- **Stats** : filtre par compétition ; V/N/D, buts pour/contre, différence ; classements Buts / Passes / Homme du match / Matchs joués.
- **Effectif** : par poste, numéro, capitaine « C », mini-stats ; fiche joueur.
- **Connexion** : écusson + « Se connecter avec Google ».

## Stack (décidée, 0 €)
- HTML/CSS/JS simple, **sans framework, sans build**.
- Code et hébergement : **GitHub Pages** sur ce dépôt public (`simratkohar/akaal-fc`), URL `https://simratkohar.github.io/akaal-fc/`.
- Données et connexion : **Firebase, offre Spark** (gratuite, sans carte bancaire) — Firestore + Authentication Google. **Ne jamais passer en offre Blaze.**

## Modèle de données (Firestore)
| Collection | Champs | Écrit par |
|---|---|---|
| `joueurs` | nom, numero, poste, uid (compte lié), role (`capitaine`/`joueur`) | capitaine |
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
