/* =========================================================
   CALCULS : résultats, stats, classements, votes, badges…
   Tout est déduit des collections (rien n'est saisi deux fois).
   ========================================================= */

const NOUS = () => Store.config().nom || 'Akaal FC';
const joueur = id => Store.get('joueurs', id);
const nomJ = id => id === 'csc' ? 'CSC' : (joueur(id)?.nom || 'Ancien joueur');
const prenom = id => id === 'csc' ? 'CSC' : nomJ(id).split(' ')[0];
const adv = m => Store.get('adversaires', m?.adversaire) || { nom: m?.adversaireNom || 'Adversaire', logo: null };
const lieuDe = m => Store.get('lieux', m?.lieu) || (m?.lieuNom ? { nom: m.lieuNom } : null);
const photoJ = j => j?.photo || j?.photoGoogle || (j && j.id === Store.moi && Store.user?.photo) || null;
// « #10 » seulement si le joueur a un numéro (l'équipe n'a pas de numéros attitrés)
const numTxt = (j, pre = ' #') => j && j.numero != null && j.numero !== '' ? pre + j.numero : '';
/* ---------- Classement FSGT collé depuis le site ----------
   Colonnes du site : N° | Équipe | PTS J G N P F Pe But+ But- Diff B/P AG UA
   Marche si le navigateur copie avec des tabulations, une case par ligne ou des espaces. */
const PETITS_MOTS = ['LE', 'LA', 'LES', 'DE', 'DU', 'DES', 'ET', 'EN', 'SUR'];
const joliNom = s => s.trim().replace(/\s+/g, ' ').split(' ').map(w => /\d/.test(w) || (!PETITS_MOTS.includes(w.toUpperCase()) && (w.length <= 2 || (w.length <= 3 && !/[AEIOUY]/i.test(w)))) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ');
const estNombre = c => /^[+-]?\d+$/.test(String(c).trim());
function ligneDepuisNombres(equipe, n) {
  const x = n.map(v => parseInt(v, 10));
  return { equipe: joliNom(equipe), pts: x[0], j: x[1], v: x[2], n: x[3], d: x[4], f: (x[5] || 0) + (x[6] || 0), bp: x[7], bc: x[8] };
}
function lireClassementColle(texte) {
  const lignes = [], vues = new Set();
  const ajoute = (rang, equipe, nums) => { if (nums.length >= 9 && /[A-Za-zÀ-ÿ]/.test(equipe) && !vues.has(rang)) { vues.add(rang); lignes.push(ligneDepuisNombres(equipe, nums)); } };
  const rows = String(texte || '').split(/\r?\n/).map(r => r.trim()).filter(Boolean);
  // 1) une ligne par équipe (tabulations ou espaces)
  rows.forEach(r => {
    let cells = r.includes('\t') ? r.split('\t').map(c => c.trim()).filter(Boolean) : null;
    if (cells && cells.length >= 11 && /^\d+$/.test(cells[0]) && !estNombre(cells[1])) return ajoute(cells[0], cells[1], cells.slice(2).filter(estNombre));
    const t = r.split(/\s+/);
    if (t.length < 11 || !/^\d+$/.test(t[0])) return;
    let fin = t.length; while (fin > 1 && estNombre(t[fin - 1])) fin--;
    const nums = t.slice(fin), debut = Math.max(0, nums.length - 13); // l'équipe peut finir par un nombre (« … 93 »)
    ajoute(t[0], t.slice(1, fin).concat(nums.slice(0, debut)).join(' '), nums.slice(debut));
  });
  if (lignes.length) return lignes;
  // 2) une case par ligne (copie depuis certains téléphones)
  const c = rows.flatMap(r => r.split('\t')).map(x => x.trim()).filter(Boolean);
  for (let i = 0; i < c.length - 10; i++) {
    if (!/^\d+$/.test(c[i]) || estNombre(c[i + 1])) continue;
    let k = i + 2; const nums = [];
    while (k < c.length && estNombre(c[k]) && nums.length < 13) nums.push(c[k++]);
    if (nums.length >= 9) { ajoute(c[i], c[i + 1], nums); i = k - 1; }
  }
  return lignes;
}

const tousJoueurs = () => Store.liste('joueurs').sort((a, b) => (a.numero || 99) - (b.numero || 99));

const resultat = m => !m?.joue ? null : m.scoreNous > m.scoreEux ? 'V' : m.scoreNous < m.scoreEux ? 'D' : 'N';
const RES_TXT = { V: 'Victoire', N: 'Nul', D: 'Défaite' };
const typeCourt = m => m.type === 'Championnat' ? `${Store.config().championnat || 'FSGT'}${m.journee ? ' · J' + m.journee : ''}` : m.type;

const matchsTries = () => Store.liste('matchs').sort((a, b) => a.date.localeCompare(b.date));
const aVenir = () => matchsTries().filter(m => !m.joue);
const termines = () => matchsTries().filter(m => m.joue).reverse();
const prochain = () => aVenir().find(m => D(m.date) > Date.now() - 3 * 3600e3) || aVenir()[0];

function saisons() {
  const s = new Set(Store.liste('matchs').map(m => m.saison || saisonDe(m.date)));
  s.add(Store.config().saison);
  return [...s].sort().reverse();
}
function matchsJoues(saison, type = 'Tous') {
  return Store.liste('matchs').filter(m => m.joue && (!saison || (m.saison || saisonDe(m.date)) === saison) && (type === 'Tous' || m.type === type))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- Présences ---------- */
const reponse = (mid, jid) => Store.get('presences', mid + '_' + jid)?.reponse;
function convoques(m) {
  const ids = new Set(Object.keys(Store.data.joueurs));
  // Par défaut : tout l'effectif, sans les joueurs occasionnels
  const base = Array.isArray(m.convoques) ? m.convoques.filter(id => ids.has(id)) : [...ids].filter(id => joueur(id)?.role !== 'invite');
  // Un joueur non convoqué qui répond quand même est compté
  Store.liste('presences').forEach(p => { if (p.match === m.id && ids.has(p.joueur) && !base.includes(p.joueur)) base.push(p.joueur); });
  return base;
}
/* Match à venir : réponses des joueurs. Match joué : présent = a joué (coché ou buteur/passeur). */
const aJoueSet = m => new Set([...(m.ontJoue || []), ...butsDe(m.id).flatMap(b => [b.buteur, b.passeur])].filter(j => j && joueur(j)));
function statutPresence(m, jid, joues = m.joue ? aJoueSet(m) : null) {
  if (!m.joue) return reponse(m.id, jid) || null;
  return joues.has(jid) ? 'present' : reponse(m.id, jid) === 'absent' ? 'absent' : null;
}
function compteurs(m) {
  const c = convoques(m), r = { p: [], a: [], q: [] };
  const joues = m.joue ? aJoueSet(m) : null;
  if (joues) joues.forEach(j => { if (!c.includes(j)) c.push(j); });
  c.forEach(j => { const x = statutPresence(m, j, joues); (x === 'present' ? r.p : x === 'absent' ? r.a : r.q).push(j); });
  const tri = l => l.sort((a, b) => (joueur(a)?.numero || 99) - (joueur(b)?.numero || 99));
  tri(r.p); tri(r.a); tri(r.q);
  return r;
}
/* Date limite de réponse (ex. la veille à 20 h) — en millisecondes */
function limiteReponse(m, cfg = Store.config()) {
  const d = D(m.date);
  if (cfg.limiteJours == null || cfg.limiteJours === '' || +cfg.limiteJours < 0) return d.getTime();
  const x = new Date(d); x.setDate(x.getDate() - (+cfg.limiteJours));
  const [h, mi] = String(cfg.limiteHeure || '20:00').split(':');
  x.setHours(+h || 0, +mi || 0, 0, 0);
  return Math.min(x.getTime(), d.getTime());
}
const limiteDe = m => m.limite || limiteReponse(m);
const reponsesOuvertes = m => !m.joue && Date.now() < limiteDe(m);

/* ---------- Buts ---------- */
const butsDe = mid => Store.liste('buts').filter(b => b.match === mid).sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));

/* ---------- Votes / homme du match / notes ---------- */
const votesDe = mid => Store.liste('votes').filter(v => v.match === mid);
const votesOuverts = m => !!(m?.joue && m.votesFin && Date.now() < m.votesFin);
function resultatVote(mid) {
  const t = {};
  votesDe(mid).forEach(v => { if (v.hommeDuMatch) t[v.hommeDuMatch] = (t[v.hommeDuMatch] || 0) + 1; });
  return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n }));
}
function hommeDuMatch(m) {
  if (!m?.joue) return null;
  const cfg = Store.config();
  if (cfg.hdmMode === 'vote' && !votesOuverts(m)) {
    const r = resultatVote(m.id);
    if (r.length) {
      const ex = r.filter(x => x.n === r[0].n).map(x => x.id);
      return ex.includes(m.hommeDuMatch) ? m.hommeDuMatch : ex[0];
    }
  }
  if (cfg.hdmMode === 'vote' && votesOuverts(m)) return null; // vote en cours
  return m.hommeDuMatch || null;
}
function noteMatch(jid, mid) {
  const n = votesDe(mid).map(v => v.notes?.[jid]).filter(x => typeof x === 'number');
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}
function noteMoyenne(jid, matchs) {
  const n = matchs.map(m => noteMatch(jid, m.id)).filter(x => x != null);
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null;
}
const fmtNote = n => n == null ? '–' : n.toFixed(1).replace('.', ',');

/* ---------- Bilan équipe ---------- */
function bilan(matchs) {
  const s = { j: matchs.length, v: 0, n: 0, d: 0, bp: 0, bc: 0 };
  matchs.forEach(m => { const r = resultat(m); s[r === 'V' ? 'v' : r === 'N' ? 'n' : 'd']++; s.bp += +m.scoreNous || 0; s.bc += +m.scoreEux || 0; });
  return s;
}

/* ---------- Classements joueurs ---------- */
function classement(type, matchs) {
  const ids = new Set(matchs.map(m => m.id)), t = {};
  const add = (id, v = 1) => { if (id && id !== 'csc' && joueur(id) && joueur(id).role !== 'invite') t[id] = (t[id] || 0) + v; };
  if (type === 'buts') Store.liste('buts').filter(b => ids.has(b.match)).forEach(b => add(b.buteur));
  if (type === 'passes') Store.liste('buts').filter(b => ids.has(b.match)).forEach(b => add(b.passeur));
  if (type === 'hdm') matchs.forEach(m => add(hommeDuMatch(m)));
  if (type === 'matchs') matchs.forEach(m => (m.ontJoue || []).forEach(j => add(j)));
  if (type === 'notes') tousJoueurs().filter(j => j.role !== 'invite').forEach(j => { const n = noteMoyenne(j.id, matchs); if (n != null) t[j.id] = Math.round(n * 10) / 10; });
  if (type === 'presence') tousJoueurs().filter(j => j.role !== 'invite').forEach(j => { const p = tauxPresence(j.id, matchs); if (p.convoc) t[j.id] = p.taux; });
  return Object.entries(t).map(([id, v]) => ({ id, v })).sort((a, b) => b.v - a.v || nomJ(a.id).localeCompare(nomJ(b.id)));
}
function tauxPresence(jid, matchs) {
  let convoc = 0, pres = 0;
  matchs.forEach(m => {
    if (!convoques(m).includes(jid)) return;
    convoc++;
    if ((m.ontJoue || []).includes(jid) || reponse(m.id, jid) === 'present') pres++;
  });
  return { convoc, pres, taux: convoc ? Math.round(pres / convoc * 100) : 0 };
}

/* ---------- Fiche joueur ---------- */
function statsJoueur(jid, matchs) {
  const ids = new Set(matchs.map(m => m.id));
  const buts = Store.liste('buts').filter(b => ids.has(b.match));
  // a joué = coché « Ont joué », ou a marqué / fait une passe dans ce match
  const joues = matchs.filter(m => (m.ontJoue || []).includes(jid) || buts.some(b => b.match === m.id && (b.buteur === jid || b.passeur === jid)));
  return {
    j: joues.length,
    g: buts.filter(b => b.buteur === jid).length,
    a: buts.filter(b => b.passeur === jid).length,
    hdm: matchs.filter(m => hommeDuMatch(m) === jid).length,
    note: noteMoyenne(jid, joues),
    presence: tauxPresence(jid, matchs),
    forme: joues.slice(-5).map(resultat)
  };
}
function badges(jid) {
  const tout = matchsJoues(null);
  const s = statsJoueur(jid, tout);
  const parMatch = {}; Store.liste('buts').filter(b => b.buteur === jid).forEach(b => parMatch[b.match] = (parMatch[b.match] || 0) + 1);
  const triple = Object.values(parMatch).some(n => n >= 3);
  return [
    { ic: 'sports_soccer', t: 'Premier but', ok: s.g >= 1 },
    { ic: 'local_fire_department', t: 'Triplé', ok: triple },
    { ic: 'filter_1', t: '10 buts', ok: s.g >= 10 }, { ic: 'filter_2', t: '20 buts', ok: s.g >= 20 }, { ic: 'filter_5', t: '50 buts', ok: s.g >= 50 },
    { ic: 'handshake', t: '10 passes', ok: s.a >= 10 },
    { ic: 'directions_run', t: '10 matchs', ok: s.j >= 10 }, { ic: 'stadium', t: '20 matchs', ok: s.j >= 20 }, { ic: 'military_tech', t: '50 matchs', ok: s.j >= 50 },
    { ic: 'star', t: 'Homme du match', ok: s.hdm >= 1 }, { ic: 'workspace_premium', t: 'HDM x5', ok: s.hdm >= 5 },
    { ic: 'event_available', t: 'Assidu 90 %', ok: s.presence.convoc >= 5 && s.presence.taux >= 90 }
  ];
}

/* ---------- Face-à-face ---------- */
function faceAFace(advId, saufId) {
  const ms = Store.liste('matchs').filter(m => m.joue && m.adversaire === advId && m.id !== saufId).sort((a, b) => b.date.localeCompare(a.date));
  return { ms, ...bilan(ms) };
}

/* ---------- Bilan de fin de saison (« Wrapped ») ---------- */
function wrapped(saison) {
  const ms = matchsJoues(saison);
  const top = t => classement(t, ms)[0];
  const ecart = m => (m.scoreNous || 0) - (m.scoreEux || 0);
  const plusGros = [...ms].filter(m => resultat(m) === 'V').sort((a, b) => ecart(b) - ecart(a) || b.scoreNous - a.scoreNous)[0];
  const votes = {}; ms.forEach(m => votesDe(m.id).forEach(v => { if (v.hommeDuMatch) votes[v.hommeDuMatch] = (votes[v.hommeDuMatch] || 0) + 1; }));
  const plusVote = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
  const presents = tousJoueurs().map(j => ({ id: j.id, ...tauxPresence(j.id, ms) })).filter(x => x.convoc).sort((a, b) => b.pres - a.pres || b.taux - a.taux)[0];
  return { ms, b: bilan(ms), buteur: top('buts'), passeur: top('passes'), hdm: top('hdm'), note: top('notes'), plusGros, plusVote, presents };
}

/* ---------- Formations (compo) ---------- */
const FORMATIONS = {
  '7': ['2-3-1', '3-2-1', '3-1-2', '2-2-2'],
  '8': ['2-3-2', '3-3-1', '3-2-2'],
  '11': ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1']
};
/* Renvoie les emplacements {id, x, y, role} ; gardien en bas */
function emplacements(formation) {
  const lignes = formation.split('-').map(Number);
  const out = [{ id: 'G', x: 50, y: 90, role: 'GAR' }];
  let m = 0;
  lignes.forEach((n, li) => {
    const y = lignes.length === 1 ? 50 : 72 - li * (56 / (lignes.length - 1));
    const role = li === 0 ? 'D' : li === lignes.length - 1 ? 'A' : 'M';
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? 50 : 14 + i * (72 / (n - 1));
      const id = role === 'M' ? 'M' + (++m) : role + (i + 1);
      out.push({ id, x, y, role: { D: 'DEF', M: 'MIL', A: 'ATT' }[role] });
    }
  });
  return out;
}

/* ---------- Paiements ---------- */
function dettesDe(jid) {
  return Store.liste('paiements').filter(p => p.joueurs && jid in p.joueurs && !p.joueurs[jid]);
}
