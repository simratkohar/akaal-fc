/* =========================================================
   CONFIGURATION FIREBASE
   ---------------------------------------------------------
   Tant que FIREBASE_CONFIG vaut null, l'app tourne en
   MODE DÉMO : données fictives enregistrées seulement sur
   ce téléphone / cet ordinateur (rien n'est partagé).

   Pour passer en vrai : coller ici l'objet fourni par la
   console Firebase (Paramètres du projet → Vos applications
   → Config). Ces valeurs ne sont pas secrètes : la sécurité
   vient des règles Firestore (fichier firestore.rules).
   ========================================================= */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAM-vEu23zut6ZCU7Zbg7aUKrunJ327tP4",
  authDomain: "akaal-fc.firebaseapp.com",
  projectId: "akaal-fc",
  storageBucket: "akaal-fc.firebasestorage.app",
  messagingSenderId: "602848986049",
  appId: "1:602848986049:web:6a349283561155eda32540"
};

/* Exemple de ce qu'il faudra coller :
const FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "akaal-fc.firebaseapp.com",
  projectId: "akaal-fc",
  storageBucket: "akaal-fc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
*/

