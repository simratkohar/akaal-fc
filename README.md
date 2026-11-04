# Akaal FC

L'app de l'équipe **Akaal FC** (Bobigny, est. 2019) : calendrier, présences, compo, résultats, buteurs, stats, homme du match, notes, paiements et classement du championnat.

**100 % gratuite**, sans pub, faite pour remplacer SportEasy.

## Pour les joueurs

👉 **https://akaal-fc.web.app**

1. Ouvre le lien (sur iPhone, avec **Safari**).
2. Connecte-toi avec ton **compte Google** : celui que tu as donné au capitaine.
3. Installe l'app : **Partager → « Sur l'écran d'accueil »** (iPhone) ou **menu ⋮ → « Installer l'application »** (Android).

Ensuite tu réponds **Présent / Absent** aux matchs, tu votes pour l'homme du match et tu changes ta photo de profil.

## Pour voir sans compte

👉 **https://akaal-fc.web.app/?voir**

Matchs, résultats, stats et effectif en direct, en lecture seule. Les e-mails, les paiements et les votes restent privés.

## Comment c'est fait

- Application web installable (téléphone et ordinateur), en HTML / CSS / JavaScript simple.
- Hébergée gratuitement sur **Firebase Hosting** ; données et connexion Google sur **Firebase** (offre gratuite).
- Les droits (capitaine / joueur / visiteur) sont vérifiés par la base de données elle-même (`firestore.rules`, testées dans `tests/regles`).

Documentation technique : [CLAUDE.md](CLAUDE.md) · mise en service Firebase : [GUIDE-FIREBASE.md](GUIDE-FIREBASE.md) · vidéos : [videos/](videos/) · maquettes : [maquettes/](maquettes/)
