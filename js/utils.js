/* Petits outils partagés par toute l'app */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic = (nom, cls = '') => `<span class="ms ${cls}">${nom}</span>`;
const initiales = n => String(n || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
const pad = n => String(n).padStart(2, '0');
const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const TYPES = ['Championnat', 'Amical', 'Tournoi'];
const FORMATS = ['7', '8', '11'];
const POSTES = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'];
const POSTE_COURT = { Gardien: 'GAR', Défenseur: 'DEF', Milieu: 'MIL', Attaquant: 'ATT' };

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const JOURS_C = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_C = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

const D = iso => new Date(iso);
const fmtJour = iso => { const d = D(iso); return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`; };
const fmtJourC = iso => { const d = D(iso); return `${JOURS_C[d.getDay()]} ${d.getDate()} ${MOIS_C[d.getMonth()]}`; };
const fmtHeure = iso => { const d = D(iso); return `${pad(d.getHours())}h${pad(d.getMinutes())}`; };
const fmtHeure2 = iso => { const d = D(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDateCourte = ms => { const d = new Date(ms); return `${d.getDate()} ${MOIS_C[d.getMonth()]} à ${pad(d.getHours())}h${pad(d.getMinutes())}`; };
const maj1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* Saison de foot : d'août à juillet. Ex. un match en mars 2027 → "2026-2027" */
function saisonDe(iso) {
  const d = D(iso), y = d.getFullYear();
  return d.getMonth() >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function toast(t) {
  const el = $('#toast'); if (!el) return;
  el.textContent = t; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* Photo : recadrage carré + compression (≈ 256 px, JPEG 0,7 → ~30 Ko) */
function compresserImage(fichier, taille = 256, qualite = 0.7) {
  return new Promise((ok, ko) => {
    const lecteur = new FileReader();
    lecteur.onerror = ko;
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => ko(new Error('Image illisible'));
      img.onload = () => {
        const c = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = taille;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0B0B0B'; ctx.fillRect(0, 0, taille, taille);
        ctx.drawImage(img, (img.width - c) / 2, (img.height - c) / 2, c, c, 0, 0, taille, taille);
        ok(canvas.toDataURL('image/jpeg', qualite));
      };
      img.src = lecteur.result;
    };
    lecteur.readAsDataURL(fichier);
  });
}

/* Ouvre le sélecteur de fichier du téléphone et renvoie l'image compressée */
function choisirPhoto() {
  return new Promise(ok => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return ok(null);
      try { ok(await compresserImage(f)); } catch { toast('Impossible de lire cette image'); ok(null); }
    };
    inp.click();
  });
}

function lienMaps(lieu) {
  if (!lieu) return null;
  if (lieu.maps) return lieu.maps;
  const q = [lieu.nom, lieu.adresse].filter(Boolean).join(', ');
  return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : null;
}
