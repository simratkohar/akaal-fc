# Passer l'app en vrai (Firebase, gratuit)

Tant que `js/config.js` contient `FIREBASE_CONFIG = null`, l'app est en **mode démo** :
données fictives, enregistrées seulement sur ton téléphone. Pour que toute l'équipe
partage les mêmes données, il faut un projet Firebase (offre **Spark**, gratuite,
**sans carte bancaire**). Ne jamais accepter de passer en offre Blaze.

On le fera ensemble, une étape à la fois. Voici le plan :

1. **Créer le projet** — https://console.firebase.google.com → « Créer un projet » →
   nom `akaal-fc` → Google Analytics : **désactivé** → Créer.
2. **Ajouter l'app web** — Page d'accueil du projet → icône `</>` → surnom `akaal-fc`
   → ne pas cocher « Hosting » → Enregistrer. Copier l'objet `firebaseConfig` affiché
   et le coller dans `js/config.js` à la place de `null`.
3. **Connexion Google** — Menu Créer → Authentication → Commencer → Google → Activer
   → choisir ton e-mail d'assistance → Enregistrer.
   Puis Authentication → Paramètres → Domaines autorisés → Ajouter
   `simratkohar.github.io`.
4. **Base de données** — Menu Créer → Firestore Database → Créer une base →
   emplacement `eur3 (europe-west)` → démarrer en **mode production**.
5. **Règles de sécurité** — Firestore → onglet Règles → tout effacer, coller le
   contenu de `firestore.rules`, remplacer `TON_EMAIL@gmail.com` par ton adresse Gmail
   de capitaine → Publier.
6. **Premier lancement** — ouvrir l'app, se connecter avec Google → écran
   « Presque prêt » → bouton **Je suis le capitaine** → l'équipe est créée.
7. **Ajouter les joueurs** — Effectif → Ajouter un joueur, avec l'adresse Gmail de
   chacun. Quand un joueur se connecte avec cette adresse, il est reconnu tout seul.

## Bon à savoir
- Les valeurs de `firebaseConfig` ne sont pas secrètes : la sécurité vient des règles.
- Les photos sont compressées (~30 Ko) et stockées dans Firestore : pas besoin de
  Firebase Storage (payant).
- Limites gratuites largement suffisantes pour une équipe : 50 000 lectures et
  20 000 écritures par jour.
- Tester les règles (optionnel, pour les développeurs) : `cd tests/regles && npm install && npm test`
  (lance un émulateur local, ne touche pas au vrai projet).
