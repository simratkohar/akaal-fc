# Vidéos Akaal FC (motion design)

Les vidéos (résultats de match, annonces, bilans) sont faites avec **HyperFrames** : on écrit l'animation
en HTML + GSAP, puis on la rend en MP4. Les règles de l'outil sont dans `.claude/skills/hyperframes/`.

- Nouveau projet : `npx hyperframes@0.9.9 init <nom> --example blank --resolution portrait --non-interactive --skip-skills`
- Rendu : `npx hyperframes@0.9.9 render -o sortie.mp4` (depuis le dossier du projet)
- Format par défaut du club : vertical 1080×1920 (story / Reel / TikTok), 30 i/s, noir et or, Bebas Neue + Manrope, écusson `assets/logo.png`.
- **GSAP en local** : dans l'environnement cloud de Claude, le CDN jsdelivr est bloqué. Copier `videos/assets/gsap.min.js`
  dans le projet et remplacer le `<script src="https://cdn.jsdelivr.net/...gsap.min.js">` par `assets/gsap.min.js`.
- Pas de musique intégrée (droits d'auteur) : on l'ajoute dans Instagram / TikTok à la publication.
