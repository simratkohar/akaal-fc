/* =========================================================
   AKAAL FC — écrans de l'app
   Navigation par adresse (#/calendrier, #/match/ID…)
   ========================================================= */

const App = {
  etat: { calFiltre: 'Tous', statsFiltre: 'Tous', statsSaison: null, statsTab: 'buts', compo: null, vote: null, voteTab: 'hdm', paiementOuvert: null },
  route: { page: 'accueil', args: [] },
};

/* ---------------- Composants ---------------- */
function avatar(jid, cls = '') {
  const j = joueur(jid), p = photoJ(j);
  return `<div class="av ${cls}">${p ? `<img src="${esc(p)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : esc(j ? initiales(j.nom) : '?')}</div>`;
}
function ecussonNous(taille = 40) {
  const logo = Store.config().logo || 'assets/logo-256.png';
  return `<div class="ecusson nous" style="width:${taille}px;height:${taille}px"><img src="${esc(logo)}" alt=""></div>`;
}
function ecussonAdv(a, taille = 40) {
  return `<div class="ecusson" style="width:${taille}px;height:${taille}px">${a?.logo ? `<img src="${esc(a.logo)}" alt="">` : `<span class="ms" style="font-size:${Math.round(taille * .5)}px">shield</span>`}</div>`;
}
function sec(titre, icone, droite = '') {
  return `<div class="sec">${icone ? ic(icone) : '<span class="barre"></span>'}<h2>${titre}</h2>${droite ? `<div class="droite">${droite}</div>` : ''}</div>`;
}
const capC = j => j?.role === 'capitaine' ? '<span class="cap-c">C</span>' : '';
const chipPoste = p => p ? `<span class="poste ${esc(p)}">${POSTE_COURT[p] || esc(p)}</span>` : '';
const vide = (txt, icone = 'sports_soccer') => `<div class="vide">${ic(icone)}${txt}</div>`;
function lienLieu(m) {
  const l = lieuDe(m); if (!l) return `<div class="lieu">${ic('stadium')}<span>Lieu à préciser</span></div>`;
  const u = lienMaps(l);
  return `<div class="lieu">${ic('stadium')}<span>${esc(l.nom)}${l.adresse ? `<br><small class="muted">${esc(l.adresse)}</small>` : ''}</span>${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">Maps ${ic('open_in_new')}</a>` : ''}</div>`;
}
function equipesOrdre(m) { // domicile en haut / à gauche
  const a = adv(m);
  const nous = { nom: NOUS(), nous: true, ec: t => ecussonNous(t), score: m.scoreNous };
  const eux = { nom: a.nom, nous: false, ec: t => ecussonAdv(a, t), score: m.scoreEux };
  return m.domicile ? [nous, eux] : [eux, nous];
}

/* ---------------- Rendu général ---------------- */
function render() {
  const app = $('#app');
  if (Store.etat === 'chargement') { document.body.classList.add('sans-nav'); app.innerHTML = `<div class="chargement"><img src="assets/logo-256.png" alt=""></div>`; return; }
  if (Store.etat === 'connexion') { document.body.classList.add('sans-nav'); app.innerHTML = pageConnexion(); return; }
  if (Store.etat === 'non-lie') { document.body.classList.add('sans-nav'); app.innerHTML = pageNonLie(); return; }
  document.body.classList.remove('sans-nav');
  const { page, args } = App.route;
  const pages = { accueil: pageAccueil, calendrier: pageCalendrier, stats: pageStats, effectif: pageEffectif, match: pageMatch, joueur: pageJoueur,
    votes: pageVotes, reglages: pageReglages, emails: pageEmails, paiements: pagePaiements, classement: pageClassement, bilan: pageBilan, profil: () => pageJoueur(Store.moi) };
  let contenu;
  try { contenu = (pages[page] || pageAccueil)(...args); }
  catch (e) { console.error(e); contenu = vide('Oups, une erreur est survenue sur cet écran.', 'error'); }
  app.innerHTML = entete() + `<main class="wrap">${contenu}</main>` + barreBas();
}
let _rafPrevu = false;
function rafRender() { if (_rafPrevu) return; _rafPrevu = true; requestAnimationFrame(() => { _rafPrevu = false; render(); }); }

const SOUS_TITRES = { accueil: 'Accueil', calendrier: 'Calendrier', stats: 'Statistiques', effectif: 'Effectif', match: 'Fiche match', joueur: 'Fiche joueur',
  votes: 'Votes du match', reglages: 'Réglages', emails: 'Accès joueurs', paiements: 'Paiements', classement: 'Classement', bilan: 'Bilan de saison', profil: 'Mon profil' };
function entete() {
  const cfg = Store.config(), moi = joueur(Store.moi);
  const demo = Store.mode === 'demo' ? `<button class="demo-btn ${Store.capitaine ? 'cap' : ''}" onclick="Store.basculeDemo();toast(Store.capitaine?'Vue capitaine':'Aperçu : vue d’un joueur')">${Store.capitaine ? '★ Cap.' : 'Joueur'}</button>` : '';
  return `<header class="top"><div class="wrap">
    <a class="crest" href="#/">${ecussonNous(42)}</a>
    <div class="titre"><h1>${esc(cfg.nom)} <span class="tag">${esc(cfg.championnat || 'FSGT')}</span></h1><small>${SOUS_TITRES[App.route.page] || ''}</small></div>
    <div class="actions">${demo}
      ${Store.capitaine ? `<a class="icon-btn or" href="#/reglages" aria-label="Réglages">${ic('tune')}</a>` : ''}
      ${Store.visiteur ? `<a class="demo-btn cap" href="./">${ic('login')} Connexion</a>` : `<a class="moi" href="#/profil" aria-label="Mon profil">${avatar(Store.moi, 'rond').replace('class="av rond"', 'class="av rond" style="width:100%;height:100%;border:0"')}</a>`}
    </div></div><div class="tricolore"></div></header>`;
}
function barreBas() {
  const p = App.route.page;
  const b = (route, icone, txt, actif) => `<button class="${actif ? 'on' : ''}" onclick="location.hash='${route}'">${ic(icone)}${txt}</button>`;
  return `<nav class="bas"><div class="wrap">
    ${b('#/', 'home', 'Accueil', p === 'accueil')}
    ${b('#/calendrier', 'calendar_month', 'Calendrier', p === 'calendrier' || p === 'match')}
    ${Store.capitaine ? `<button class="plus" onclick="formMatch()"><span class="rond-plus">${ic('add')}</span>Match</button>` : ''}
    ${b('#/stats', 'leaderboard', 'Stats', ['stats', 'classement', 'bilan'].includes(p))}
    ${b('#/effectif', 'groups', 'Effectif', p === 'effectif' || (p === 'joueur'))}
  </div></nav>`;
}

/* ---------------- Connexion ---------------- */
function pageConnexion() {
  return `<div class="connexion">
    <img class="logo" src="assets/logo-256.png" alt="Écusson Akaal FC">
    <h1>Akaal FC</h1>
    <p>L'app de l'équipe : matchs, présences, compo, stats.</p>
    <button class="btn-google" onclick="Store.connexionGoogle()"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Se connecter avec Google</button>
    <p style="font-size:12px">Utilise le compte Google que tu as donné au capitaine.</p>
    <a class="lien-btn" href="?voir">${ic('visibility')} Voir l’app sans compte</a>
  </div>`;
}
function pageNonLie() {
  return `<div class="connexion">
    <img class="logo" src="assets/logo-256.png" alt="" style="width:120px;height:120px">
    <h1 style="font-size:36px">Presque prêt</h1>
    <p>Ton compte <b class="or-t">${esc(Store.user?.email)}</b> n'est pas encore dans l'effectif.<br>Envoie cette adresse au capitaine pour qu'il t'ajoute, puis reconnecte-toi.</p>
    ${Store.erreur ? `<p style="font-size:11px">(${esc(Store.erreur)})</p>` : ''}
    <button class="btn" style="max-width:320px" onclick="location.reload()">${ic('refresh')} Réessayer</button>
    <button class="btn gris" style="max-width:320px" onclick="formCreerEquipe()">${ic('shield_person')} Je suis le capitaine</button>
    <button class="lien-btn" onclick="Store.deconnexion()">Changer de compte</button>
  </div>`;
}

/* ---------------- Accueil ---------------- */
function pageAccueil() {
  const cfg = Store.config(), moi = Store.moi;
  let h = '';
  // Alertes perso : paiements, votes
  const dettes = dettesDe(moi);
  if (dettes.length) {
    const tot = dettes.reduce((s, p) => s + (+p.montant || 0), 0);
    h += `<a class="alerte or clic" href="#/paiements">${ic('account_balance_wallet')}<span>Tu dois <b>${tot} €</b> · ${dettes.map(p => esc(p.libelle)).join(', ')}</span></a>`;
  }
  termines().filter(m => votesOuverts(m) && (m.ontJoue || []).includes(moi) && !Store.get('votes', m.id + '_' + moi)).slice(0, 1).forEach(m => {
    h += `<a class="alerte vert clic" href="#/votes/${m.id}">${ic('how_to_vote')}<span><b>Vote ouvert</b> : homme du match contre ${esc(adv(m).nom)} · clôture ${fmtDateCourte(m.votesFin)}</span></a>`;
  });

  // Sur PC : prochain match à gauche, le reste à droite (sur téléphone : l'un sous l'autre)
  h += `<div class="cols-pc"><div class="col-pc">`;
  const m = prochain();
  if (m) h += heroMatch(m);
  else h += `<div class="hero rayures">${vide('Aucun match prévu pour l’instant', 'event_busy')}${Store.capitaine ? `<button class="btn" onclick="formMatch()">${ic('add')} Planifier un match</button>` : ''}</div>`;

  const der = termines()[0];
  if (der) h += carteDernier(der);
  h += `</div><div class="col-pc">`;

  const ms = matchsJoues(cfg.saison), s = bilan(ms);
  const cl = classementFSGT(), pos = cl.findIndex(l => estNous(l.equipe));
  h += sec(`Bilan saison ${esc(cfg.saison)}`, 'emoji_events', pos >= 0 ? `<a href="#/classement" class="chip plein">${pos + 1}${pos ? 'e' : 'er'} · ${cl[pos].pts} pts</a>` : '');
  h += `<div class="kpis"><div class="kpi"><b>${s.j}</b><span>Joués</span></div><div class="kpi v"><b>${s.v}</b><span>Victoires</span></div><div class="kpi"><b>${s.n}</b><span>Nuls</span></div><div class="kpi d"><b>${s.d}</b><span>Défaites</span></div></div>`;

  const top = classement('buts', ms).slice(0, 3), max = top[0]?.v || 1;
  h += sec('Top buteurs', 'sports_soccer', `<a href="#/stats">Classement club</a>`);
  h += top.length ? top.map((x, i) => rangLigne(x, i, max, 'buts', ms)).join('') : `<div class="carte">${vide('Pas encore de but cette saison')}</div>`;

  h += `<div class="duo"><a class="btn sec" href="#/classement">${ic('format_list_numbered')} Classement</a><a class="btn sec" href="#/bilan">${ic('auto_awesome')} Bilan saison</a></div>`;
  h += `</div></div>`;
  if (Store.visiteur) h += `<p class="note-bas">APERÇU EN DIRECT · LECTURE SEULE</p><a class="btn gris" href="./">${ic('login')} Je suis dans l’équipe : me connecter</a>`;
  if (Store.mode === 'demo') h += `<p class="note-bas">${Store.visite ? 'APERÇU · VRAIES DONNÉES SPORTEASY · SANS LES PHOTOS' : 'MODE DÉMO · DONNÉES FICTIVES · RIEN N\'EST PARTAGÉ'}</p>${typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG ? `<a class="btn gris" href="./">${ic('login')} Se connecter</a>` : ''}`;
  return h;
}
function compteARebours(iso) {
  const ms = D(iso) - Date.now();
  if (ms < 0) return `<div class="compte"><div><b>${ic('sports')}</b><span>EN COURS</span></div></div>`;
  const j = Math.floor(ms / 864e5), hh = Math.floor(ms % 864e5 / 36e5), mi = Math.floor(ms % 36e5 / 6e4);
  return `<div class="compte"><div><b>${j}</b><span>JOURS</span></div><div><b>${pad(hh)}</b><span>HEURES</span></div><div><b>${pad(mi)}</b><span>MIN</span></div></div>`;
}
function heroMatch(m) {
  const [g, d] = equipesOrdre(m), c = compteurs(m), tot = c.p.length + c.a.length + c.q.length || 1;
  const eq = (e, cote) => `<div class="eq">${e.ec(64)}<span>${e.nous ? (m.domicile ? 'DOM' : 'EXT') : (m.domicile ? 'EXT' : 'DOM')}</span><b>${esc(e.nom)}</b></div>`;
  return `<section class="hero rayures">
    <div class="tete"><div class="chips"><span class="chip plein">${esc(typeCourt(m))}</span><span class="chip">Foot à ${esc(m.format)}</span></div>
      <div class="when">${ic('schedule')}${fmtJourC(m.date)} · ${fmtHeure(m.date)}</div></div>
    <div class="face">${eq(g)}<div class="mil"><div class="vs">VS</div>${compteARebours(m.date)}</div>${eq(d)}</div>
    ${lienLieu(m)}
    <div class="tricolore fin mt16"></div>
    ${blocPresence(m)}
    <div class="compteurs"><span class="p">${c.p.length} présent${c.p.length > 1 ? 's' : ''}</span><span class="a">${c.a.length} absent${c.a.length > 1 ? 's' : ''}</span><span class="q">${c.q.length} sans réponse</span></div>
    <div class="jauge"><i class="p" style="width:${c.p.length / tot * 100}%"></i><i class="a" style="width:${c.a.length / tot * 100}%"></i></div>
    <div class="entre mt12"><div class="pile">${c.p.slice(0, 6).map(j => avatar(j, 's rond')).join('')}${c.p.length > 6 ? `<div class="av s rond">+${c.p.length - 6}</div>` : ''}</div>
      <a class="lien-btn" href="#/match/${m.id}/presences">Voir la feuille ${ic('chevron_right')}</a></div>
  </section>`;
}
function blocPresence(m, jid = Store.moi) {
  if (!jid || !joueur(jid)) return '';
  const r = reponse(m.id, jid), ouvert = reponsesOuvertes(m);
  const bloque = !ouvert && !Store.capitaine;
  const conv = convoques(m).includes(jid);
  return `<div class="entre mt12"><span class="label or">${conv ? 'Ta convocation' : 'Non convoqué'}</span><span class="label">${esc(nomJ(jid))}${esc(numTxt(joueur(jid)))}</span></div>
    <div class="presence">
      <button class="oui ${r === 'present' ? 'on' : ''}" ${bloque ? 'disabled' : ''} onclick="repondre('${m.id}','present')">${ic('check_circle')} Présent</button>
      <button class="non ${r === 'absent' ? 'on' : ''}" ${bloque ? 'disabled' : ''} onclick="repondre('${m.id}','absent')">${ic('cancel')} Absent</button>
    </div>
    <div class="info-limite">${ic('timer')} ${ouvert ? `Réponse possible jusqu’au ${fmtDateCourte(limiteDe(m))}` : 'Réponses fermées' + (Store.capitaine ? ' (le capitaine peut encore modifier)' : '')}</div>`;
}
function carteDernier(m) {
  const r = resultat(m), bs = butsDe(m.id), h = hommeDuMatch(m);
  const parJ = {}; bs.filter(b => b.buteur).forEach(b => (parJ[b.buteur] = parJ[b.buteur] || []).push(b.minute));
  const txt = Object.entries(parJ).map(([j, mins]) => `<b>${esc(prenom(j))}</b>${mins.some(x => x != null) ? ` <span class="muted">(${mins.filter(x => x != null).map(x => x + '’').join(', ')})</span>` : (mins.length > 1 ? ` x${mins.length}` : '')}`).join(' · ');
  const [g, d] = equipesOrdre(m);
  return `${sec('Dernier match', 'history', `<span class="chip ${r === 'V' ? 'vert' : r === 'D' ? 'rouge' : ''}">${RES_TXT[r]}</span>`)}
  <a class="carte pad clic" style="display:block;color:inherit" href="#/match/${m.id}/stats">
    <div class="chips"><span class="chip or">${esc(typeCourt(m))}</span><span class="label">${fmtJourC(m.date)}</span></div>
    <div class="score-bloc mt12"><div class="eq"><b>${esc(g.nom)}</b><div class="num ${g.nous ? 'nous' : ''}">${g.score}</div></div><div class="mid">SCORE<br>FINAL</div><div class="eq"><b>${esc(d.nom)}</b><div class="num ${d.nous ? 'nous' : ''}">${d.score}</div></div></div>
    ${txt ? `<div class="buteurs">${ic('sports_soccer')}<span>${txt}</span></div>` : ''}
    ${h ? `<div class="hdm-ligne">${ic('star', 'fill')} Homme du match : ${esc(nomJ(h))}${noteMatch(h, m.id) != null ? ` <span class="muted" style="margin-left:auto">Note ${fmtNote(noteMatch(h, m.id))}</span>` : ''}</div>` : votesOuverts(m) ? `<div class="hdm-ligne">${ic('how_to_vote')} Vote de l’homme du match en cours</div>` : ''}
  </a>`;
}
const UNITES = { buts: 'buts', passes: 'passes', hdm: 'HDM', matchs: 'matchs', notes: '/10', presence: '%' };
// ms = les matchs du classement affiché (saison + compétition filtrées) : le ratio se calcule sur ces matchs-là
function rangLigne(x, i, max, type, ms = []) {
  const j = joueur(x.id), val = type === 'notes' ? fmtNote(x.v) : x.v;
  const joues = type === 'buts' ? statsJoueur(x.id, ms).j : 0;
  const sous = type === 'buts' && joues ? `${(x.v / joues).toFixed(2).replace('.', ',')} / match · ${joues} joué${joues > 1 ? 's' : ''}` : '';
  return `<a class="carte rang clic ${i === 0 ? 'r1' : ''}" style="color:inherit" href="#/joueur/${x.id}">
    <div class="pos">${i + 1}</div>${avatar(x.id)}
    <div class="t"><b>${esc(j?.nom)}${capC(j)}</b><span>${[j?.poste, numTxt(j, '#')].filter(Boolean).map(esc).join(' · ')}</span><div class="barre-p"><i style="width:${(type === 'notes' ? x.v / 10 : type === 'presence' ? x.v / 100 : x.v / max) * 100}%"></i></div></div>
    <div class="val"><b>${val}</b><span>${x.v === 1 && ['buts', 'passes', 'matchs'].includes(type) ? UNITES[type].slice(0, -1) : UNITES[type]}</span>${sous ? `<div class="label" style="font-size:9px">${sous}</div>` : ''}</div></a>`;
}

/* ---------------- Calendrier ---------------- */
function filtres(cle, val) {
  return `<div class="filtres">${['Tous', ...TYPES].map(t => `<button class="${val === t ? 'on' : ''}" onclick="App.etat.${cle}='${t}';render()">${t}</button>`).join('')}</div>`;
}
function pageCalendrier() {
  const f = App.etat.calFiltre;
  const ms = matchsTries().filter(m => f === 'Tous' || m.type === f);
  const up = ms.filter(m => !m.joue), fin = ms.filter(m => m.joue).reverse(), b = bilan(fin);
  let h = filtres('calFiltre', f);
  h += sec('À venir', null, `${up.length} match${up.length > 1 ? 's' : ''}`);
  h += up.length ? `<div class="grille-pc">${up.map((m, i) => carteMatch(m, i === 0)).join('')}</div>` : `<div class="carte">${vide('Aucun match prévu', 'event_busy')}</div>`;
  h += sec('Terminés', null, `<span class="chips"><span class="chip vert">${b.v}V</span><span class="chip">${b.n}N</span><span class="chip rouge">${b.d}D</span></span>`);
  h += fin.length ? `<div class="grille-pc">${fin.map(m => carteMatch(m)).join('')}</div>` : `<div class="carte">${vide('Aucun résultat pour l’instant')}</div>`;
  if (Store.capitaine) h += `<button class="btn" onclick="formMatch()">${ic('add_circle')} Planifier un match</button>`;
  return h;
}
function carteMatch(m, estProchain = false) {
  const r = resultat(m), d = D(m.date), eqs = equipesOrdre(m);
  let droiteHaut = '';
  if (m.joue) droiteHaut = `<span class="chip ${r === 'V' ? 'vert' : r === 'D' ? 'rouge' : ''}">${r}</span>`;
  else { const x = reponse(m.id, Store.moi); droiteHaut = x === 'present' ? `<span class="chip vert">Présent</span>` : x === 'absent' ? `<span class="chip rouge">Absent</span>` : `<span class="chip orange">En attente</span>`; }
  const c = !m.joue ? compteurs(m) : null;
  const bs = m.joue ? butsDe(m.id).filter(b => b.buteur) : [];
  const parJ = {}; bs.forEach(b => parJ[b.buteur] = (parJ[b.buteur] || 0) + 1);
  const butTxt = Object.entries(parJ).map(([j, n]) => esc(prenom(j)) + (n > 1 ? ` x${n}` : '')).join(' · ');
  const l = lieuDe(m);
  return `<a class="carte mcarte clic ${m.joue ? r : estProchain ? 'prochain' : ''}" style="color:inherit" href="#/match/${m.id}">
    <div class="haut"><span class="chip or">${esc(typeCourt(m))}</span><span class="chip">${m.domicile ? 'Domicile' : 'Extérieur'}</span><span class="chip">À ${esc(m.format)}</span><span class="droite">${droiteHaut}</span></div>
    <div class="corps">
      <div class="date"><span>${JOURS_C[d.getDay()]}</span><b>${pad(d.getDate())}</b><span>${MOIS_C[d.getMonth()]}</span><i>${fmtHeure2(m.date)}</i></div>
      <div class="equipes">${eqs.map(e => `<div class="equipe ${e.nous ? 'nous' : ''}">${e.ec(22)}<b>${esc(e.nom)}</b></div>`).join('')}</div>
      ${m.joue ? `<div class="scores">${eqs.map(e => `<b class="${e.nous ? 'nous' : 'eux'}">${e.score}</b>`).join('')}</div>`
        : `<div style="text-align:right"><div class="heure">${fmtHeure2(m.date)}</div><div class="label mt8" style="color:var(--vert)">${c.p.length} présent${c.p.length > 1 ? 's' : ''}</div></div>`}
    </div>
    <div class="bas">${m.joue && butTxt ? `${ic('sports_soccer')}<span>${butTxt}</span>` : `${ic('location_on')}<span>${esc(l?.nom || 'Lieu à préciser')}</span>`}
      <span class="droite">${m.joue ? (hommeDuMatch(m) ? '★ ' + esc(prenom(hommeDuMatch(m))) : '') : `${c.q.length} sans réponse`}</span></div>
  </a>`;
}

/* ---------------- Fiche match ---------------- */
function pageMatch(id, onglet) {
  const m = Store.get('matchs', id);
  if (!m) return `<a class="retour" href="#/calendrier">${ic('arrow_back')} Calendrier</a>${vide('Match introuvable (supprimé ?)', 'search_off')}`;
  onglet = onglet || (m.joue ? 'stats' : 'infos');
  const [g, d] = equipesOrdre(m), r = resultat(m), c = compteurs(m);
  const eq = e => `<div class="eq">${e.ec(58)}<b>${esc(e.nom)}</b><span>${e.nous ? (m.domicile ? 'Domicile' : 'Extérieur') : (m.domicile ? 'Extérieur' : 'Domicile')}</span></div>`;
  let h = `<a class="retour" href="#/calendrier">${ic('arrow_back')} Calendrier</a>
  <section class="carte entete-match rayures or">
    <div class="entre"><div class="ligne-date">${ic('calendar_today')}${maj1(fmtJour(m.date))} · ${fmtHeure(m.date)}</div>${r ? `<span class="chip ${r === 'V' ? 'vert' : r === 'D' ? 'rouge' : ''}">${RES_TXT[r]}</span>` : `<span class="chip orange">À venir</span>`}</div>
    <div class="sb">${eq(g)}<div>${m.joue ? `<div class="res"><span class="${g.nous ? 'nous' : ''}">${g.score}</span> - <span class="${d.nous ? 'nous' : ''}">${d.score}</span><small>Score final</small></div>` : `<div class="heure-grande">${fmtHeure2(m.date)}</div>`}</div>${eq(d)}</div>
    <div class="tricolore fin mt16"></div>
    <div class="chips mt12" style="justify-content:center"><span class="chip plein">${esc(typeCourt(m))}</span><span class="chip">Foot à ${esc(m.format)}</span></div>
  </section>
  <div class="onglets">
    ${[['infos', 'Infos'], ['presences', `Présences <span class="n">${c.p.length}</span>`], ['compo', 'Compo'], ['stats', 'Stats']].map(([k, t]) =>
      `<button class="${onglet === k ? 'on' : ''}" onclick="location.replace('#/match/${m.id}/${k}')">${t}</button>`).join('')}
  </div>`;
  h += ({ infos: ongletInfos, presences: ongletPresences, compo: ongletCompo, stats: ongletStats })[onglet]?.(m) || '';
  return h;
}
function ongletInfos(m) {
  const a = adv(m), ff = m.adversaire ? faceAFace(m.adversaire, m.id) : null;
  let h = `<div class="info-grille mt16">
    <div class="carte"><span class="label">Type</span><b>${esc(typeCourt(m))}</b></div>
    <div class="carte"><span class="label">Format</span><b>Foot à ${esc(m.format)}</b></div>
    <div class="carte"><span class="label">Terrain</span><b>${m.domicile ? 'Domicile' : 'Extérieur'}</b></div>
    <div class="carte"><span class="label">Coup d’envoi</span><b>${fmtHeure(m.date)}</b></div></div>
    <div class="mt8">${lienLieu(m)}</div>`;
  if (!m.joue) h += `<div class="carte pad mt12">${blocPresence(m)}</div>`;
  if (ff) {
    h += sec(`Face-à-face`, 'swords', esc(a.nom));
    h += ff.j ? `<div class="kpis"><div class="kpi"><b>${ff.j}</b><span>Matchs</span></div><div class="kpi v"><b>${ff.v}</b><span>V</span></div><div class="kpi"><b>${ff.n}</b><span>N</span></div><div class="kpi d"><b>${ff.d}</b><span>D</span></div></div>
      <div class="carte liste mt8">${ff.ms.slice(0, 5).map(x => `<a class="ligne clic" style="color:inherit" href="#/match/${x.id}"><span class="chip ${resultat(x) === 'V' ? 'vert' : resultat(x) === 'D' ? 'rouge' : ''}">${resultat(x)}</span><div class="t"><b>${x.scoreNous} - ${x.scoreEux}</b><span>${fmtJourC(x.date)} ${new Date(x.date).getFullYear()} · ${esc(typeCourt(x))}</span></div>${ic('chevron_right')}</a>`).join('')}</div>`
      : `<div class="carte">${vide('Première rencontre contre cette équipe', 'handshake')}</div>`;
  }
  if (Store.capitaine) h += `<button class="btn" onclick="formResultat('${m.id}')">${ic('scoreboard')} ${m.joue ? 'Modifier le résultat' : 'Saisir le résultat'}</button>
    <button class="btn gris" onclick="formMatch('${m.id}')">${ic('edit')} Modifier le match</button>`;
  return h;
}
function ongletPresences(m) {
  const c = compteurs(m), cap = Store.capitaine, cfg = Store.config();
  let h = m.joue ? '' : `<div class="carte pad mt16">${blocPresence(m)}</div>`;
  if (cap) h += `<p class="aide mt12">${ic('more_vert')} Touche les 3 points à droite d’un joueur pour changer ${m.joue ? 's’il a joué ou non' : 'sa réponse'}.</p>`;
  const ST = {
    present: { t: m.joue ? 'A joué' : 'Présent', c: 'var(--vert)', i: 'check' },
    absent: { t: 'Absent', c: 'var(--rouge)', i: 'close' },
    q: { t: m.joue ? 'Pas renseigné' : 'Sans réponse', c: 'var(--orange)', i: 'question_mark' }
  };
  const ligne = (j, k) => `<div class="ligne"><div class="av-statut">${avatar(j, 'rond')}<span class="pastille" style="background:${ST[k].c}">${ic(ST[k].i)}</span></div>
    <div class="t"><b>${esc(nomJ(j))}${capC(joueur(j))}${joueur(j)?.role === 'invite' ? ' <span class="chip">Occasionnel</span>' : ''}</b><span style="color:${ST[k].c};font-weight:700">${ST[k].t}</span></div>
    ${cap ? `<button class="icon-btn" style="border:0;background:none" aria-label="Changer" onclick="menuPresence('${m.id}','${j}')">${ic('more_vert')}</button>` : ''}</div>`;
  h += sec(`${m.joue ? 'Ont joué' : 'Présents'} (${c.p.length})`, 'check_circle', !m.joue && cfg.maxJoueurs > 0 ? `max ${cfg.maxJoueurs}` : '');
  h += `<div class="carte liste">${c.p.map(j => ligne(j, 'present')).join('') || vide('Personne pour l’instant', 'person_off')}</div>`;
  h += sec(`Absents (${c.a.length})`, 'cancel');
  h += `<div class="carte liste">${c.a.map(j => ligne(j, 'absent')).join('') || vide('Aucun absent', 'sentiment_satisfied')}</div>`;
  if (c.q.length || !m.joue) {
    h += sec(`${ST.q.t} (${c.q.length})`, 'hourglass_top');
    h += `<div class="carte liste">${c.q.map(j => ligne(j, 'q')).join('') || vide('Tout le monde a répondu', 'done_all')}</div>`;
  }
  if (cap) h += `<button class="btn sec" onclick="formOccasionnel('${m.id}')">${ic('person_add')} Ajouter un joueur occasionnel</button>`;
  if (cap && !m.joue && c.q.length) h += `<button class="btn sec" onclick="relanceWhatsApp('${m.id}')">${ic('chat')} Relancer sur WhatsApp</button>`;
  return h;
}

/* ----- Compo ----- */
function ongletCompo(m) {
  const N = +m.format || 7, presents = compteurs(m).p;
  const edit = App.etat.compo && App.etat.compo.match === m.id ? App.etat.compo : null;
  const compo = edit || m.compo;
  let h = '';
  if (!m.joue && presents.length < N) h += `<div class="alerte">${ic('warning')}<span>Il manque <b>${N - presents.length} joueur${N - presents.length > 1 ? 's' : ''}</b> (sur ${N}) pour une compo complète.</span></div>`;
  if (!compo) {
    return h + `<div class="carte mt12 terrain-vide">${terrainSvg()}<div><b style="font-family:var(--titre);font-size:26px;color:var(--blanc);font-weight:400">Pas de composition</b><p class="muted">${Store.capitaine ? 'Place les joueurs présents sur le terrain.' : 'Le capitaine n’a pas encore publié la compo.'}</p></div>
      ${Store.capitaine ? `<button class="btn" style="width:auto" onclick="compoCreer('${m.id}')">${ic('add')} Créer une compo</button>` : ''}</div>`;
  }
  const slots = emplacements(compo.formation);
  h += `<div class="carte pad mt12"><div class="entre">
    ${edit ? `<div style="flex:1;min-width:0"><input class="in" value="${esc(edit.nom)}" placeholder="Nom de la compo" oninput="App.etat.compo.nom=this.value"></div>`
      : `<div><div class="nom-t" style="font-family:var(--titre);font-size:26px;color:var(--or-2);line-height:1">${ic('grid_view')} ${esc(compo.formation)}</div><span class="label">${esc(compo.nom || 'Composition')} · Foot à ${N}</span></div>`}
    ${edit ? '' : Store.capitaine ? `<button class="btn petit sec" onclick="compoModifier('${m.id}')">${ic('edit')} Modifier</button>` : ''}
  </div>
  ${edit ? `<label class="f">Formation</label><div class="choix">${(FORMATIONS[m.format] || FORMATIONS['7']).map(f => `<button class="${edit.formation === f ? 'on' : ''}" onclick="compoFormation('${f}')">${f}</button>`).join('')}</div>` : ''}
  </div>
  <div class="terrain">
    <div class="tl cadre"></div><div class="tl mil"></div><div class="tl rond"></div><div class="tl surf-b"></div><div class="tl surf-h"></div>
    ${slots.map(s => {
      const jid = compo.postes?.[s.id], j = joueur(jid);
      const clic = edit ? `onclick="compoChoisir('${s.id}')"` : (j ? `onclick="location.hash='#/joueur/${jid}'"` : '');
      return `<div class="slot" style="left:${s.x}%;top:${s.y}%;${clic ? 'cursor:pointer' : ''}" ${clic}>
        ${j ? `${avatar(jid)}<span class="num">${esc(j.numero ?? '')}</span><span class="nm">${esc(prenom(jid))}${j.role === 'capitaine' ? ' (C)' : ''}</span>` : `<div class="av vide-slot">${ic(edit ? 'add' : 'person')}</div><span class="nm">${s.role}</span>`}
        ${j ? `<span class="ps">${s.role}</span>` : ''}</div>`;
    }).join('')}
  </div>`;
  const remp = (compo.remplacants || []).filter(joueur);
  h += sec('Remplaçants', 'airline_seat_recline_normal', `${remp.length}`);
  h += `<div class="remplacants">${remp.map(j => `<div class="carte">${avatar(j, 's')}<div><b style="color:var(--blanc);font-size:13px">${esc(prenom(j))}</b><div>${chipPoste(joueur(j)?.poste)}</div></div>${edit ? `<button onclick="compoRetirerRemp('${j}')" class="muted">${ic('close')}</button>` : ''}</div>`).join('') || `<span class="muted" style="font-size:13px">Aucun remplaçant</span>`}
    ${edit ? `<button class="carte" style="color:var(--or)" onclick="compoAjouterRemp()">${ic('person_add')} Ajouter</button>` : ''}</div>`;
  if (edit) h += `<div class="duo"><button class="btn gris" onclick="App.etat.compo=null;render()">Annuler</button><button class="btn" onclick="compoEnregistrer()">${ic('check')} Enregistrer</button></div>
    ${m.compo ? `<button class="btn danger" onclick="compoSupprimer('${m.id}')">Supprimer la compo</button>` : ''}`;
  else if (navigator.share) h += `<button class="btn sec" onclick="partagerCompo('${m.id}')">${ic('share')} Partager la compo</button>`;
  return h;
}
function terrainSvg() {
  return `<svg width="120" height="160" viewBox="0 0 68 96" fill="none" stroke="#C9A24A" stroke-opacity=".5" stroke-width="1.2"><rect x="2" y="2" width="64" height="92" rx="3"/><line x1="2" y1="48" x2="66" y2="48"/><circle cx="34" cy="48" r="9"/><rect x="17" y="2" width="34" height="14"/><rect x="17" y="80" width="34" height="14"/></svg>`;
}

/* ----- Stats du match ----- */
function ongletStats(m) {
  if (!m.joue) return `<div class="carte mt16">${vide('Le match n’est pas encore joué.', 'hourglass_empty')}</div>${Store.capitaine ? `<button class="btn" onclick="formResultat('${m.id}')">${ic('scoreboard')} Saisir le résultat</button>` : ''}`;
  const bs = butsDe(m.id), h_ = hommeDuMatch(m), ouvert = votesOuverts(m), moi = Store.moi;
  let h = '';
  // Homme du match
  h += sec('Homme du match', 'star', ouvert ? 'Vote en cours' : Store.config().hdmMode === 'vote' ? 'Vote joueurs' : 'Choix capitaine');
  if (h_) {
    const s = statsJoueur(h_, [m]), n = noteMatch(h_, m.id);
    h += `<a class="carte hdm-carte clic" style="color:inherit" href="#/joueur/${h_}">${avatar(h_, 'l or')}<div class="t" style="min-width:0"><div class="nom-t">${esc(nomJ(h_))}${capC(joueur(h_))}</div><span class="label">${esc(joueur(h_)?.poste || '')}</span><div class="chips mt8">${s.g ? `<span class="chip">${ic('sports_soccer')} ${s.g} but${s.g > 1 ? 's' : ''}</span>` : ''}${s.a ? `<span class="chip">${s.a} passe${s.a > 1 ? 's' : ''}</span>` : ''}</div></div>${n != null ? `<div class="note-box"><span>NOTE</span><b>${fmtNote(n)}</b></div>` : ''}</a>`;
  } else h += `<div class="carte">${vide(ouvert ? 'Le vote est en cours…' : 'Pas d’homme du match désigné', 'how_to_vote')}</div>`;
  if (m.votesFin) {
    const nb = votesDe(m.id).length, peut = (m.ontJoue || []).includes(moi);
    const aVote = !!Store.get('votes', m.id + '_' + moi);
    h += `<div class="alerte ${ouvert ? 'vert' : 'or'}">${ic(ouvert ? 'how_to_vote' : 'lock')}<span>${ouvert ? `Votes ouverts jusqu’au <b>${fmtDateCourte(m.votesFin)}</b>` : 'Votes clos'} · ${nb} vote${nb > 1 ? 's' : ''}${ouvert && peut ? (aVote ? ' · tu as voté ✓' : '') : ''}</span></div>
      <a class="btn ${ouvert && peut && !aVote ? '' : 'sec'}" href="#/votes/${m.id}">${ic(ouvert && peut ? 'how_to_vote' : 'bar_chart')} ${ouvert && peut ? (aVote ? 'Modifier mon vote' : 'Voter et noter') : 'Voir les votes et notes'}</a>`;
  }
  // Buts
  h += sec('Buts', 'sports_soccer', `${bs.length} but${bs.length > 1 ? 's' : ''}`);
  let n = 0;
  h += `<div class="carte">${bs.map(b => { n++; return `<div class="but"><span class="min">${b.minute != null ? b.minute + '’' : n}</span><div class="t"><b>${esc(nomJ(b.buteur))}${b.buteur !== 'csc' ? esc(numTxt(joueur(b.buteur))) : ''}</b><span>${b.buteur === 'csc' ? 'But contre son camp adverse' : b.passeur ? 'Passe décisive : ' + esc(nomJ(b.passeur)) : 'Sans passe'}</span></div></div>`; }).join('') || vide('Aucun but marqué', 'sports_soccer')}</div>`;
  // Effectif & notes
  const voirNotes = !ouvert || Store.capitaine;
  const oj = (m.ontJoue || []).filter(joueur).sort((a, b) => (joueur(a).numero || 99) - (joueur(b).numero || 99));
  h += sec(`Ont joué (${oj.length})`, 'groups');
  h += `<div class="carte liste">${oj.map(j => { const s = statsJoueur(j, [m]), nt = voirNotes ? noteMatch(j, m.id) : null; return `<a class="ligne clic" style="color:inherit" href="#/joueur/${j}"><span class="maillot-num" style="font-size:30px;width:34px;text-align:center">${esc(joueur(j).numero ?? '')}</span><div class="t"><b>${esc(nomJ(j))}${capC(joueur(j))} ${chipPoste(joueur(j).poste)}</b><span>${[s.g && `${s.g} but${s.g > 1 ? 's' : ''}`, s.a && `${s.a} passe${s.a > 1 ? 's' : ''}`, h_ === j && 'Homme du match'].filter(Boolean).join(' · ') || '—'}</span></div>${nt != null ? `<span class="note-box" style="padding:4px 8px"><b style="font-size:22px">${fmtNote(nt)}</b></span>` : ''}</a>`; }).join('') || vide('Liste non renseignée', 'group_off')}</div>`;
  if (Store.capitaine) h += `<button class="btn" onclick="formResultat('${m.id}')">${ic('edit_note')} Modifier la feuille de match</button>`;
  if (navigator.share) h += `<button class="btn sec" onclick="partagerResultat('${m.id}')">${ic('share')} Partager le résumé</button>`;
  return h;
}

/* ---------------- Votes ---------------- */
function pageVotes(mid) {
  const m = Store.get('matchs', mid); if (!m) return vide('Match introuvable', 'search_off');
  const moi = Store.moi, ouvert = votesOuverts(m), peut = ouvert && (m.ontJoue || []).includes(moi);
  if (!App.etat.vote || App.etat.vote.match !== mid) {
    const v = Store.get('votes', mid + '_' + moi);
    App.etat.vote = { match: mid, hdm: v?.hommeDuMatch || null, notes: { ...(v?.notes || {}) } };
    App.etat.voteTab = peut ? 'hdm' : 'resultats';
  }
  const ev = App.etat.vote, tab = App.etat.voteTab;
  const [g, d] = equipesOrdre(m);
  const autres = (m.ontJoue || []).filter(j => j !== moi && joueur(j));
  let h = `<a class="retour" href="#/match/${mid}/stats">${ic('arrow_back')} Fiche match</a>
  <section class="carte entete-match rayures or"><div class="entre"><span class="label or">● ${esc(typeCourt(m))} · ${RES_TXT[resultat(m)]}</span><span class="label">${ic('schedule')} ${ouvert ? 'Clôture ' + fmtDateCourte(m.votesFin) : 'Votes clos'}</span></div>
  <div class="score-bloc mt12"><div class="eq"><b>${esc(g.nom)}</b></div><div class="res" style="font-family:var(--titre);font-size:48px;color:var(--blanc)"><span class="${g.nous ? 'or-t' : ''}">${g.score}</span> : <span class="${d.nous ? 'or-t' : ''}">${d.score}</span></div><div class="eq"><b>${esc(d.nom)}</b></div></div></section>
  <div class="seg">${peut ? `<button class="${tab === 'hdm' ? 'on' : ''}" onclick="App.etat.voteTab='hdm';render()">Vote HDM</button><button class="${tab === 'notes' ? 'on' : ''}" onclick="App.etat.voteTab='notes';render()">Noter (1-10)</button>` : ''}<button class="${tab === 'resultats' ? 'on' : ''}" onclick="App.etat.voteTab='resultats';render()">Résultats</button></div>`;
  if (tab === 'hdm' && peut) {
    h += sec('Homme du match') + `<p class="muted" style="margin-top:-6px;margin-bottom:12px">Choisis le joueur le plus décisif (un seul vote, pas toi-même).</p>`;
    h += `<div class="votes-grille">${autres.map(j => { const s = statsJoueur(j, [m]); return `<button class="carte vcarte ${ev.hdm === j ? 'on' : ''}" onclick="App.etat.vote.hdm='${j}';render()">${ev.hdm === j ? `<span class="ok">${ic('check')}</span>` : ''}${avatar(j)}<b>${esc(prenom(j))}</b><span>${[s.g && `${s.g} but${s.g > 1 ? 's' : ''}`, s.a && `${s.a} passe${s.a > 1 ? 's' : ''}`].filter(Boolean).join(' · ') || esc(numTxt(joueur(j), '#'))}</span><div class="mt8">${chipPoste(joueur(j).poste)}</div></button>`; }).join('')}</div>`;
    h += `<button class="btn" onclick="App.etat.voteTab='notes';render();scrollTo(0,0)">${ic('arrow_forward')} Suivant : noter les coéquipiers</button>`;
  } else if (tab === 'notes' && peut) {
    h += sec('Noter mes coéquipiers') + `<p class="muted" style="margin-top:-6px;margin-bottom:12px">Facultatif. Laisse « – » pour ne pas noter.</p>`;
    h += `<div class="carte">${autres.map(j => `<div class="note-ligne">${avatar(j, 's')}<b style="flex:0 0 90px;color:var(--blanc);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(prenom(j))}</b>
      <input type="range" min="0" max="10" step="1" value="${ev.notes[j] ?? 0}" oninput="App.etat.vote.notes['${j}']=+this.value||undefined;if(!+this.value)delete App.etat.vote.notes['${j}'];this.nextElementSibling.textContent=+this.value||'–'"><output>${ev.notes[j] ?? '–'}</output></div>`).join('')}</div>`;
    h += `<button class="btn" onclick="enregistrerVote()">${ic('how_to_vote')} Valider mon vote</button>`;
  } else {
    const voirTout = !ouvert || Store.capitaine;
    const r = resultatVote(mid), tot = votesDe(mid).length;
    h += sec('Votes homme du match', 'star', `${tot} votant${tot > 1 ? 's' : ''}`);
    if (!voirTout) h += `<div class="carte">${vide('Les résultats seront visibles à la clôture du vote.', 'lock_clock')}</div>`;
    else {
      h += `<div class="carte liste">${r.map(x => `<div class="ligne">${avatar(x.id)}<div class="t"><b>${esc(nomJ(x.id))}</b><div class="barre-p" style="max-width:none"><i style="width:${x.n / (r[0].n || 1) * 100}%"></i></div></div><b class="maillot-num" style="font-size:28px">${x.n}</b></div>`).join('') || vide('Aucun vote', 'how_to_vote')}</div>`;
      const notes = (m.ontJoue || []).filter(joueur).map(j => ({ j, n: noteMatch(j, mid) })).filter(x => x.n != null).sort((a, b) => b.n - a.n);
      h += sec('Notes moyennes', 'grade');
      h += `<div class="carte liste">${notes.map(x => `<div class="ligne">${avatar(x.j, 's')}<div class="t"><b>${esc(nomJ(x.j))}</b></div><b class="or-t" style="font-family:var(--titre);font-size:24px">${fmtNote(x.n)}</b></div>`).join('') || vide('Aucune note', 'grade')}</div>`;
    }
    if (Store.capitaine && Store.config().hdmMode === 'capitaine') h += `<p class="aide mt12">Réglage actuel : l’homme du match est le choix du capitaine (le vote est indicatif).</p>`;
  }
  return h;
}

/* ---------------- Stats ---------------- */
function pageStats() {
  const ss = saisons(); if (!App.etat.statsSaison) App.etat.statsSaison = Store.config().saison;
  const saison = App.etat.statsSaison, f = App.etat.statsFiltre, ms = matchsJoues(saison, f), s = bilan(ms);
  let h = `<div class="entre mt16"><span class="label">Saison</span><select class="in" style="width:auto;padding:8px 36px 8px 12px" onchange="App.etat.statsSaison=this.value;render()">${ss.map(x => `<option ${x === saison ? 'selected' : ''}>${x}</option>`).join('')}</select></div>`;
  h += filtres('statsFiltre', f);
  h += sec('Bilan', 'monitoring', `${s.j} match${s.j > 1 ? 's' : ''}`);
  h += `<div class="kpis"><div class="kpi v"><b>${s.v}</b><span>V</span></div><div class="kpi"><b>${s.n}</b><span>N</span></div><div class="kpi d"><b>${s.d}</b><span>D</span></div><div class="kpi or"><b>${s.bp - s.bc > 0 ? '+' : ''}${s.bp - s.bc}</b><span>Diff.</span></div></div>
    <div class="kpis k2 mt8"><div class="kpi"><b>${s.bp}</b><span>Buts marqués</span></div><div class="kpi"><b>${s.bc}</b><span>Buts encaissés</span></div></div>`;
  const tabs = { buts: 'Buts', passes: 'Passes', hdm: 'HDM', matchs: 'Matchs', notes: 'Notes', presence: 'Présence' };
  h += sec('Classements', 'leaderboard');
  h += `<div class="filtres" style="margin-top:0">${Object.entries(tabs).map(([k, t]) => `<button class="${App.etat.statsTab === k ? 'on' : ''}" onclick="App.etat.statsTab='${k}';render()">${t}</button>`).join('')}</div>`;
  const cl = classement(App.etat.statsTab, ms), max = cl[0]?.v || 1;
  h += `<div class="mt12 grille-pc">${cl.length ? cl.map((x, i) => rangLigne(x, i, max, App.etat.statsTab, ms)).join('') : `<div class="carte">${vide('Pas encore de données', 'query_stats')}</div>`}</div>`;
  h += `<div class="duo"><a class="btn sec" href="#/classement">${ic('format_list_numbered')} Classement ${esc(Store.config().championnat || 'FSGT')}</a><a class="btn sec" href="#/bilan">${ic('auto_awesome')} Bilan saison</a></div>`;
  return h;
}

/* ---------------- Classement FSGT ---------------- */
const estNous = nom => String(nom || '').trim().toLowerCase() === NOUS().trim().toLowerCase();
// Barème FSGT : victoire 3, nul 2, défaite 1, forfait / pénalité 0. Si les points officiels sont saisis, on les garde.
const ptsFSGT = l => (l.pts != null && l.pts !== '') ? +l.pts : (+l.v || 0) * 3 + (+l.n || 0) * 2 + (+l.d || 0);
function trierClassement(lignes) {
  return (lignes || []).map(l => ({ ...l, pts: ptsFSGT(l), diff: (+l.bp || 0) - (+l.bc || 0) }))
    .sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.bp - a.bp);
}
function classementFSGT() { return trierClassement(Store.get('equipe', 'classement')?.lignes); }
function tableauClassement(l) {
  return `<div class="tab-scroll mt8"><table class="tableau"><thead><tr><th>#</th><th>Équipe</th><th>Pts</th><th>J</th><th>V</th><th>N</th><th>D</th><th>BP</th><th>BC</th><th>+/-</th></tr></thead><tbody>
    ${l.map((x, i) => `<tr class="${estNous(x.equipe) ? 'nous' : ''}"><td>${i + 1}</td><td>${esc(x.equipe)}</td><td class="pts">${x.pts}</td><td>${x.j ?? ''}</td><td>${x.v ?? ''}</td><td>${x.n ?? ''}</td><td>${x.d ?? ''}</td><td>${x.bp ?? ''}</td><td>${x.bc ?? ''}</td><td>${x.diff > 0 ? '+' : ''}${x.diff}</td></tr>`).join('') || `<tr><td colspan="10">${vide('Tableau pas encore saisi', 'table_chart')}</td></tr>`}
    </tbody></table></div>`;
}
/* Lien #/classement/<code> : remplit le tableau d'un coup (capitaine) */
async function enregistrerClassementLien(code) {
  const lignes = decodeEmails(code); if (!Array.isArray(lignes)) return toast('Lien invalide');
  if (await Store.set('equipe', 'classement', { lignes, maj: new Date().toISOString().slice(0, 10) })) { toast('Classement mis à jour ✓'); location.replace('#/classement'); }
}
function pageClassement(code) {
  const cfg = Store.config(), c = Store.get('equipe', 'classement'), l = classementFSGT();
  let h = `<a class="retour" href="#/stats">${ic('arrow_back')} Stats</a>`;
  if (code) {
    const lignes = decodeEmails(code);
    if (!Array.isArray(lignes)) return h + vide('Lien invalide', 'link_off');
    if (!Store.capitaine) return h + vide('Réservé au capitaine', 'lock');
    return h + sec('Nouveau classement', 'format_list_numbered') + `<div class="carte pad"><span class="label or">Aperçu avant enregistrement</span>${tableauClassement(trierClassement(lignes))}</div>
      <button class="btn" onclick="enregistrerClassementLien('${esc(code)}')">${ic('save')} Enregistrer ce classement</button><a class="btn gris" href="#/classement">Annuler</a>`;
  }
  h += sec(`Classement ${esc(cfg.championnat || 'FSGT')}`, 'format_list_numbered', c?.maj ? 'MAJ ' + esc(c.maj.split('-').reverse().join('/')) : '');
  h += `<div class="carte pad"><span class="label or">${esc(cfg.groupe || '')}</span>${tableauClassement(l)}</div>`;
  h += `<a class="btn sec" href="https://www.footfsgtidf.org/" target="_blank" rel="noopener">${ic('open_in_new')} Classement officiel</a>
    <p class="aide" style="text-align:center">Sur le site : <b>Football à 7 → 93 Groupe 1</b></p>`;
  if (Store.capitaine) h += `<button class="btn" onclick="formClassement()">${ic('edit')} Mettre à jour le tableau</button>`;
  return h;
}

/* ---------------- Bilan de saison ---------------- */
function pageBilan() {
  const saison = App.etat.statsSaison || Store.config().saison, w = wrapped(saison);
  const carte = (label, contenu) => `<div class="carte wcarte rayures">${contenu.replace('%L', `<span class="label or">${label}</span>`)}</div>`;
  const jc = (label, x, unite) => x ? carte(label, `%L${avatar(x.id, 'l or')}<b>${esc(nomJ(x.id))}</b><span class="d">${unite(x.v)}</span>`) : '';
  let h = `<a class="retour" href="#/stats">${ic('arrow_back')} Stats</a>
    <div class="sec"><span class="barre"></span><h2>Bilan ${esc(saison)}</h2></div>
    <select class="in" onchange="App.etat.statsSaison=this.value;render()">${saisons().map(x => `<option ${x === saison ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <div class="wrapped mt16">`;
  if (!w.ms.length) return h + `<div class="carte">${vide('Aucun match joué sur cette saison', 'event_busy')}</div></div>`;
  h += carte('La saison', `%L<b>${w.b.j} matchs</b><span class="d">${w.b.v} victoires · ${w.b.n} nuls · ${w.b.d} défaites<br>${w.b.bp} buts marqués, ${w.b.bc} encaissés</span>`);
  h += jc('Meilleur buteur', w.buteur, v => `${v} but${v > 1 ? 's' : ''}`);
  h += jc('Meilleur passeur', w.passeur, v => `${v} passe${v > 1 ? 's' : ''} décisive${v > 1 ? 's' : ''}`);
  if (w.plusGros) h += carte('Plus gros score', `%L<b>${w.plusGros.scoreNous} - ${w.plusGros.scoreEux}</b><span class="d">contre ${esc(adv(w.plusGros).nom)} · ${fmtJourC(w.plusGros.date)}</span>`);
  if (w.presents) h += jc('Le plus présent', { id: w.presents.id, v: w.presents }, v => `${v.pres} matchs sur ${v.convoc} (${v.taux} %)`);
  h += jc('Homme du match le plus souvent', w.hdm, v => `${v} fois`);
  if (w.plusVote) h += jc('Le plus de votes reçus', { id: w.plusVote[0], v: w.plusVote[1] }, v => `${v} vote${v > 1 ? 's' : ''}`);
  h += jc('Meilleure note moyenne', w.note, v => `${fmtNote(v)} / 10`);
  return h + '</div>';
}

/* ---------------- Effectif ---------------- */
function pageEffectif() {
  const ms = matchsJoues(Store.config().saison);
  let h = '';
  POSTES.forEach(po => {
    const js = tousJoueurs().filter(j => j.poste === po && j.role !== 'invite'); if (!js.length) return;
    h += sec(po + 's', null, `${js.length}`);
    h += `<div class="carte liste">${js.map(j => { const s = statsJoueur(j.id, ms); return `<a class="ligne clic" style="color:inherit" href="#/joueur/${j.id}">
      ${avatar(j.id)}<div class="t"><b class="nom-t">${esc(j.nom)}${capC(j)}</b><span>${s.j} match${s.j > 1 ? 's' : ''} · ${s.g} but${s.g > 1 ? 's' : ''} · ${s.a} passe${s.a > 1 ? 's' : ''}${s.hdm ? ` · ${s.hdm}★` : ''}</span></div>
      <span class="maillot-num">${esc(j.numero ?? '')}</span></a>`; }).join('')}</div>`;
  });
  const sansPoste = tousJoueurs().filter(j => !POSTES.includes(j.poste) && j.role !== 'invite');
  if (sansPoste.length) h += sec('Poste à définir', null, `${sansPoste.length}`) + `<div class="carte liste">${sansPoste.map(j => { const s = statsJoueur(j.id, ms); return `<a class="ligne clic" style="color:inherit" href="#/joueur/${j.id}">${avatar(j.id)}<div class="t"><b class="nom-t">${esc(j.nom)}${capC(j)}</b><span>${s.j} match${s.j > 1 ? 's' : ''} · ${s.g} but${s.g > 1 ? 's' : ''}</span></div><span class="maillot-num">${esc(j.numero ?? '')}</span></a>`; }).join('')}</div>`;
  const invites = tousJoueurs().filter(j => j.role === 'invite');
  if (invites.length) h += sec('Joueurs occasionnels', null, `${invites.length}`) + `<div class="carte liste">${invites.map(j => `<a class="ligne clic" style="color:inherit" href="#/joueur/${j.id}">${avatar(j.id)}<div class="t"><b>${esc(j.nom)}</b><span>Vient dépanner · hors classements</span></div></a>`).join('')}</div>`;
  if (!h) h = `<div class="carte mt16">${vide('Aucun joueur dans l’effectif', 'group_off')}</div>`;
  if (Store.capitaine) h += `<button class="btn" onclick="formJoueur()">${ic('person_add')} Ajouter un joueur</button>`;
  return h;
}

/* ---------------- Fiche joueur ---------------- */
function pageJoueur(id) {
  const j = joueur(id); if (!j) return `<a class="retour" href="#/effectif">${ic('arrow_back')} Effectif</a>` + vide('Joueur introuvable', 'person_off');
  const cfg = Store.config(), ms = matchsJoues(cfg.saison), s = statsJoueur(id, ms), moi = id === Store.moi;
  const peutPhoto = moi || Store.capitaine;
  let h = `<a class="retour" href="#/effectif">${ic('arrow_back')} Effectif</a>
  <section class="carte profil-tete rayures or">
    <div class="photo-wrap">${avatar(id, 'xl')}${peutPhoto ? `<button class="photo-btn" onclick="changerPhoto('${id}')" aria-label="Changer la photo">${ic('photo_camera')}</button>` : ''}</div>
    ${peutPhoto ? `<button class="lien-btn mt12" onclick="changerPhoto('${id}')">${ic('add_a_photo')} Changer la photo de profil</button>` : ''}
    <h2>${esc(j.nom)}</h2>
    <div class="chips">${j.role === 'capitaine' ? '<span class="chip plein">C · Capitaine</span>' : ''}${numTxt(j, '') ? `<span class="chip or">#${esc(j.numero)}</span>` : ''}${chipPoste(j.poste)}</div>
    ${Store.capitaine || moi ? `<div class="duo" style="max-width:360px;margin:0 auto">${Store.capitaine ? `<button class="btn" onclick="formJoueur('${id}')">${ic('edit')} Modifier</button>` : ''}${moi && Store.mode === 'firebase' ? `<button class="btn gris" onclick="Store.deconnexion()">${ic('logout')} Déconnexion</button>` : ''}</div>` : ''}
  </section>`;
  h += sec(`Saison ${esc(cfg.saison)}`, 'emoji_events');
  h += `<div class="kpis"><div class="kpi"><b>${s.j}</b><span>Matchs</span></div><div class="kpi v"><b>${s.g}</b><span>Buts</span></div><div class="kpi"><b>${s.a}</b><span>Passes D.</span></div><div class="kpi"><b>${s.hdm}<small style="font-size:18px;color:var(--or)">★</small></b><span>HDM</span></div></div>`;
  h += `<div class="carte pad mt8"><div class="entre"><span class="label">${ic('event_available')} Taux de présence</span><b class="or-t" style="font-family:var(--titre);font-size:30px">${s.presence.taux} %</b></div>
    <div class="jauge"><i class="p" style="width:${s.presence.taux}%"></i></div><p class="aide">${s.presence.pres} présence${s.presence.pres > 1 ? 's' : ''} sur ${s.presence.convoc} convocation${s.presence.convoc > 1 ? 's' : ''}</p></div>`;
  h += `<div class="kpis k2 mt8"><div class="kpi"><span>Forme (5 derniers)</span><div class="forme mt8" style="justify-content:center">${s.forme.length ? s.forme.map(r => `<span class="${r}">${r}</span>`).join('') : '<span class="muted">–</span>'}</div></div>
    <div class="kpi or"><b class="or-t">${fmtNote(s.note)}</b><span>Note moyenne / 10</span></div></div>`;
  const dettes = (moi || Store.capitaine) ? Store.liste('paiements').filter(p => p.joueurs && id in p.joueurs) : [];
  if (dettes.length) {
    h += sec('Paiements', 'account_balance_wallet');
    h += `<div class="carte liste">${dettes.map(p => `<a class="ligne clic" style="color:inherit" href="#/paiements/${p.id}"><div class="t"><b>${esc(p.libelle)}</b><span>${p.montant} €</span></div><span class="statut ${p.joueurs[id] ? 'ok' : 'ko'}">${ic(p.joueurs[id] ? 'check_circle' : 'hourglass_empty')} ${p.joueurs[id] ? 'Payé' : 'Pas payé'}</span></a>`).join('')}</div>`;
  }
  h += sec('Badges', 'military_tech', 'toutes saisons');
  h += `<div class="badges">${badges(id).map(b => `<div class="badge ${b.ok ? 'on' : ''}">${ic(b.ic, b.ok ? 'fill' : '')}<b>${b.t}</b></div>`).join('')}</div>`;
  const derniers = ms.filter(m => (m.ontJoue || []).includes(id)).reverse().slice(0, 5);
  if (derniers.length) {
    h += sec('Derniers matchs', 'history');
    h += `<div class="carte liste">${derniers.map(m => { const x = statsJoueur(id, [m]), nt = noteMatch(id, m.id); return `<a class="ligne clic" style="color:inherit" href="#/match/${m.id}"><span class="chip ${resultat(m) === 'V' ? 'vert' : resultat(m) === 'D' ? 'rouge' : ''}">${resultat(m)}</span><div class="t"><b>${esc(adv(m).nom)} · ${m.scoreNous}-${m.scoreEux}</b><span>${fmtJourC(m.date)} · ${[x.g && x.g + ' but' + (x.g > 1 ? 's' : ''), x.a && x.a + ' passe' + (x.a > 1 ? 's' : ''), x.hdm && '★ HDM'].filter(Boolean).join(' · ') || '—'}</span></div>${nt != null ? `<b class="or-t" style="font-family:var(--titre);font-size:22px">${fmtNote(nt)}</b>` : ''}</a>`; }).join('')}</div>`;
  }
  if (moi && Store.mode === 'firebase') h += `<p class="note-bas">Connecté avec ${esc(Store.user?.email)}</p>`;
  return h;
}

/* ---------------- Paiements ---------------- */
function pagePaiements(ouvert) {
  if (Store.visiteur) return vide('Réservé aux membres de l’équipe', 'lock');
  const cap = Store.capitaine, moi = Store.moi;
  const ps = Store.liste('paiements').sort((a, b) => String(b.echeance || '').localeCompare(String(a.echeance || '')));
  let h = `<a class="retour" href="${cap ? '#/reglages' : '#/'}">${ic('arrow_back')} ${cap ? 'Réglages' : 'Accueil'}</a>
    <div class="entre mt12"><span class="label or">Trésorerie · ${esc(Store.config().nom)}</span><span class="label">Saison ${esc(Store.config().saison)}</span></div>
    <p class="aide">Suivi des cotisations et frais. Aucun paiement en ligne : le capitaine coche qui a payé (espèces / virement).</p>`;
  const mesDettes = dettesDe(moi);
  if (mesDettes.length) h += `<div class="alerte or">${ic('account_balance_wallet')}<span>Tu dois <b>${mesDettes.reduce((s, p) => s + (+p.montant || 0), 0)} €</b> : ${mesDettes.map(p => esc(p.libelle) + ' (' + p.montant + ' €)').join(', ')}</span></div>`;
  const visibles = cap ? ps : ps.filter(p => p.joueurs && moi in p.joueurs);
  h += `<div class="mt16">`;
  visibles.forEach(p => {
    const ids = Object.keys(p.joueurs || {}).filter(joueur), payes = ids.filter(j => p.joueurs[j]).length, mt = +p.montant || 0;
    const pct = ids.length ? Math.round(payes / ids.length * 100) : 0;
    const det = ouvert === p.id;
    h += `<div class="carte collecte rayures ${det ? 'or' : ''}">
      <div class="entre"><span class="label or">${esc(p.saison || '')}</span>${p.echeance ? `<span class="chip ${pct === 100 ? 'vert' : 'or'}">${pct === 100 ? 'Complet' : 'Échéance ' + esc(p.echeance.split('-').reverse().slice(0, 2).join('/'))}</span>` : ''}</div>
      <h3>${esc(p.libelle)} · ${mt} €</h3>
      ${cap ? `<div class="gros">${payes * mt} €<small>/ ${ids.length * mt} € collectés</small></div>
        <div class="entre mt8"><span class="label">Reste : ${(ids.length - payes) * mt} €</span><span class="label or">${payes}/${ids.length} payés (${pct} %)</span></div>
        <div class="jauge"><i class="p" style="width:${pct}%"></i></div>`
        : `<div class="mt12"><span class="statut ${p.joueurs[moi] ? 'ok' : 'ko'}" style="display:inline-flex">${ic(p.joueurs[moi] ? 'check_circle' : 'hourglass_empty')} ${p.joueurs[moi] ? 'Payé' : 'Pas payé'}</span></div>`}
      ${cap ? `<div class="entre mt12"><button class="lien-btn" onclick="location.replace('#/paiements${det ? '' : '/' + p.id}')">${ic(det ? 'expand_less' : 'expand_more')} ${det ? 'Masquer' : 'Détail par joueur'}</button><button class="lien-btn" onclick="formCollecte('${p.id}')">${ic('edit')} Modifier</button></div>` : ''}
    </div>`;
    if (cap && det) {
      h += `<div class="carte liste" style="margin:-4px 0 14px">${ids.sort((a, b) => (joueur(a).numero || 99) - (joueur(b).numero || 99)).map(j => `<div class="ligne">${avatar(j)}<div class="t"><b class="nom-t">${esc(nomJ(j))} <span class="or-t">${esc(numTxt(joueur(j), '#'))}</span></b></div>
        <button class="statut ${p.joueurs[j] ? 'ok' : 'ko'}" onclick="basculePaiement('${p.id}','${j}')">${ic(p.joueurs[j] ? 'check_circle' : 'hourglass_empty')} ${p.joueurs[j] ? 'Payé' : 'Pas payé'}</button></div>`).join('')}</div>`;
      const impayes = ids.filter(j => !p.joueurs[j]);
      if (impayes.length) h += `<button class="btn sec" style="margin-top:0;margin-bottom:14px" onclick="relancePaiement('${p.id}')">${ic('chat')} Rappel WhatsApp (${impayes.length} non payés)</button>`;
    }
  });
  if (!visibles.length) h += `<div class="carte">${vide(cap ? 'Aucune collecte pour l’instant' : 'Rien à payer pour toi 👍', 'savings')}</div>`;
  h += `</div>`;
  if (cap) h += `<button class="btn" onclick="formCollecte()">${ic('add_circle')} Nouvelle cotisation / collecte</button>`;
  return h;
}

/* ---------------- Réglages (capitaine) ---------------- */
function pageReglages(sous) {
  if (!Store.capitaine) return vide('Réservé au capitaine', 'lock');
  if (sous === 'lieux') return pageLieux();
  if (sous === 'adversaires') return pageAdversaires();
  const cfg = Store.config(), moi = joueur(Store.moi);
  const ligne = (icone, titre, sousT, action, extra = '') => `<button class="reglage" style="width:100%;text-align:left" onclick="${action}"><span class="ic">${ic(icone)}</span><span class="t"><b>${titre} ${extra}</b><span>${sousT}</span></span>${ic('chevron_right')}</button>`;
  const nbPay = Store.liste('paiements').filter(p => Object.values(p.joueurs || {}).some(v => !v)).length;
  const conv = TYPES.map(t => `${t} : ${Array.isArray(cfg.convocation?.[t]) ? cfg.convocation[t].length + ' joueurs' : 'tous'}`).join(' · ');
  const lim = +cfg.limiteJours < 0 ? 'pas de limite' : `${['le jour même', 'la veille', '2 jours avant', '3 jours avant'][+cfg.limiteJours] || cfg.limiteJours + ' j avant'} à ${cfg.limiteHeure}`;
  let h = `<section class="carte pad rayures mt16"><div class="flex">${avatar(Store.moi, 'l or')}<div style="min-width:0"><div class="nom-t" style="font-family:var(--titre);font-size:26px;color:var(--blanc);line-height:1">${esc(moi?.nom || '')} <span class="or-t">${esc(numTxt(moi, '#'))}</span></div><span class="label or">Capitaine & gestionnaire</span></div><span class="chip plein" style="margin-left:auto">Admin</span></div></section>`;
  h += sec('Paiements & trésorerie', 'payments');
  h += `<div class="carte">${ligne('account_balance_wallet', 'Liste des paiements', 'Cotisations, tournois… Suivi manuel, 0 € en ligne', "location.hash='#/paiements'", nbPay ? `<span class="chip or">${nbPay} en cours</span>` : '')}</div>`;
  h += sec('Équipe & identité', 'shield');
  h += `<div class="carte">${ligne('badge', esc(cfg.nom), `Saison ${esc(cfg.saison)} · ${esc(cfg.championnat)} · ${esc(cfg.couleurs || '')}`, 'formEquipe()')}
    ${ligne('groups', 'Effectif & accès', `${Store.liste('joueurs').length} joueurs · e-mails Google pour la connexion`, "location.hash='#/effectif'")}</div>`;
  h += sec('Paramètres des matchs', 'sports_soccer');
  h += `<div class="carte">
    ${ligne('location_on', 'Lieux enregistrés', `${Store.liste('lieux').length} stades / gymnases`, "location.hash='#/reglages/lieux'")}
    ${ligne('shield', 'Adversaires', `${Store.liste('adversaires').length} équipes · logos, face-à-face`, "location.hash='#/reglages/adversaires'")}
    ${ligne('star', 'Votes et notes du match', `${cfg.hdmMode === 'vote' ? 'HDM = vote des joueurs' : 'HDM = choix du capitaine'} · clôture ${cfg.votesHeures} h`, 'formVotes()')}
    ${ligne('person_check', 'Membres concernés', conv, 'formMembres()')}
    ${ligne('event_available', 'Gestion des présences', `Réponse ${lim}${+cfg.maxJoueurs > 0 ? ' · max ' + cfg.maxJoueurs + ' joueurs' : ''}`, 'formPresences()')}
    ${ligne('format_list_numbered', 'Classement ' + esc(cfg.championnat), 'Tableau du groupe + lien officiel', "location.hash='#/classement'")}
  </div>`;
  if (Store.mode === 'firebase' && !Store.get('joueurs', 'j1')) h += `<button class="btn" onclick="if(confirm('Importer les joueurs, adversaires et matchs repris de SportEasy ? Ta fiche sera remplacée par « Simrat Kohar ».'))Store.importerDonnees()">${ic('cloud_download')} Importer les données SportEasy</button>`;
  h += `<button class="btn sec" onclick="partagerLien()">${ic('share')} Partager le lien de l’app à l’équipe</button>`;
  if (Store.mode === 'demo') h += `<button class="btn danger" onclick="if(confirm('Remettre les données de démo à zéro ?'))Store.reinitDemo()">${ic('restart_alt')} Réinitialiser la démo</button>`;
  else h += `<button class="btn danger" onclick="Store.deconnexion()">${ic('logout')} Se déconnecter</button>`;
  h += `<p class="note-bas">AKAAL FC · EST. 2019 · ${Store.mode === 'demo' ? 'MODE DÉMO' : 'CONNECTÉ'}</p>`;
  return h;
}
/* Lien spécial #/emails/<code> : enregistre d'un coup les e-mails Google des joueurs.
   Les adresses restent dans le lien (jamais publiées dans le dépôt). */
function decodeEmails(code) {
  try { return JSON.parse(decodeURIComponent(escape(atob(code.replace(/-/g, '+').replace(/_/g, '/'))))); } catch { return null; }
}
function pageEmails(code) {
  if (!Store.capitaine) return vide('Réservé au capitaine', 'lock');
  const liste = decodeEmails(code || '');
  if (!liste) return vide('Lien invalide', 'link_off');
  const lignes = Object.entries(liste).map(([id, email]) => ({ id, email: String(email).trim().toLowerCase(), j: joueur(id) }));
  const aFaire = lignes.filter(l => l.j && l.j.email !== l.email);
  let h = `<a class="retour" href="#/reglages">${ic('arrow_back')} Réglages</a>${sec('E-mails des joueurs', 'alternate_email', `${lignes.length}`)}
    <p class="aide" style="margin-bottom:12px">Chaque joueur pourra se connecter avec cette adresse Google et retrouvera son profil.</p>
    <div class="carte liste">${lignes.map(l => `<div class="ligne">${l.j ? avatar(l.id) : `<div class="av">?</div>`}<div class="t"><b>${esc(l.j?.nom || 'Joueur introuvable')}</b><span>${esc(l.email)}</span></div>${!l.j ? '' : l.j.email === l.email ? `<span class="statut ok">${ic('check_circle')} OK</span>` : `<span class="chip or">Nouveau</span>`}</div>`).join('')}</div>`;
  h += aFaire.length ? `<button class="btn" onclick="enregistrerEmails('${esc(code)}')">${ic('save')} Enregistrer ${aFaire.length} e-mail${aFaire.length > 1 ? 's' : ''}</button>`
    : `<div class="alerte vert">${ic('check_circle')}<span>Tout est déjà enregistré.</span></div><a class="btn sec" href="#/effectif">${ic('groups')} Voir l’effectif</a>`;
  return h;
}
async function enregistrerEmails(code) {
  const liste = decodeEmails(code); if (!liste) return;
  const ops = Object.entries(liste).filter(([id, e]) => joueur(id) && joueur(id).email !== String(e).trim().toLowerCase())
    .map(([id, e]) => ({ op: 'patch', col: 'joueurs', id, obj: { email: String(e).trim().toLowerCase() } }));
  if (await Store.batch(ops)) toast(`${ops.length} e-mail${ops.length > 1 ? 's' : ''} enregistré${ops.length > 1 ? 's' : ''} ✓`);
}

function pageLieux() {
  const ls = Store.liste('lieux').sort((a, b) => a.nom.localeCompare(b.nom));
  return `<a class="retour" href="#/reglages">${ic('arrow_back')} Réglages</a>${sec('Lieux enregistrés', 'location_on', ls.length)}
    <div class="carte liste">${ls.map(l => `<button class="ligne" style="width:100%;text-align:left" onclick="formLieu('${l.id}')"><span class="reglage" style="padding:0;border:0"><span class="ic">${ic('stadium')}</span></span><div class="t"><b>${esc(l.nom)}</b><span>${esc(l.adresse || 'Adresse non renseignée')}</span></div>${ic('edit')}</button>`).join('') || vide('Aucun lieu', 'location_off')}</div>
    <button class="btn" onclick="formLieu()">${ic('add_location_alt')} Ajouter un lieu</button>`;
}
function pageAdversaires() {
  const as = Store.liste('adversaires').sort((a, b) => a.nom.localeCompare(b.nom));
  return `<a class="retour" href="#/reglages">${ic('arrow_back')} Réglages</a>${sec('Adversaires', 'shield', as.length)}
    <div class="carte liste">${as.map(a => { const f = faceAFace(a.id); return `<button class="ligne" style="width:100%;text-align:left" onclick="formAdversaire('${a.id}')">${ecussonAdv(a, 40)}<div class="t"><b>${esc(a.nom)}</b><span>${f.j ? `${f.j} match${f.j > 1 ? 's' : ''} · ${f.v}V ${f.n}N ${f.d}D · ${f.bp}-${f.bc}` : 'Jamais affronté'}</span></div>${ic('edit')}</button>`; }).join('') || vide('Aucun adversaire', 'shield')}</div>
    <button class="btn" onclick="formAdversaire()">${ic('add')} Ajouter un adversaire</button>`;
}

/* ---------------- Navigation ---------------- */
function lireRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const page = parts[0] || 'accueil';
  const avant = App.route.page + '/' + App.route.args[0];
  App.route = { page, args: parts.slice(1) };
  if (page !== 'match') App.etat.compo = null;
  if (page !== 'votes') App.etat.vote = null;
  render();
  if (avant !== page + '/' + parts[1]) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', lireRoute);
setInterval(() => { if (App.route.page === 'accueil' && Store.etat === 'pret' && !$('.fond.ouvert')) render(); }, 60e3);

/* ---------------- Démarrage ---------------- */
Store.surChangement(rafRender);
document.addEventListener('DOMContentLoaded', () => {
  lireRoute();
  Store.init().catch(e => { console.error(e); $('#app').innerHTML = `<div class="connexion"><h1>Erreur</h1><p>${esc(e.message || e)}</p><button class="btn" onclick="location.reload()">Réessayer</button></div>`; });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
});
