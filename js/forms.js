/* =========================================================
   FORMULAIRES & ACTIONS (feuilles qui montent du bas)
   La plupart sont réservés au capitaine ; la base de données
   (règles Firestore) refuse de toute façon les autres.
   ========================================================= */

let F = {}; // brouillon du formulaire ouvert

function ouvrirFeuille(html) {
  $('#feuille').innerHTML = `<div class="poignee"></div><button class="fermer" onclick="fermerFeuille()">Fermer</button>` + html;
  $('#fond').classList.add('ouvert'); $('#feuille').scrollTop = 0;
}
function fermerFeuille() { $('#fond').classList.remove('ouvert'); }
document.addEventListener('DOMContentLoaded', () => $('#fond').addEventListener('click', e => { if (e.target.id === 'fond') fermerFeuille(); }));

function choixHtml(cle, options, val, lab = x => x, apres = '') {
  return `<div class="choix">${options.map(o => `<button type="button" class="${String(val) === String(o) ? 'on' : ''}" onclick="choisir(this,'${cle}','${o}');${apres}">${lab(o)}</button>`).join('')}</div>`;
}
function choisir(btn, cle, val) {
  btn.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('on')); btn.classList.add('on');
  F[cle] = val === 'true' ? true : val === 'false' ? false : val;
}
function cochesHtml(ids, selection, onclickFn) {
  return `<div class="coches">${ids.map(j => `<button type="button" class="${selection.has(j) ? 'on' : ''}" onclick="${onclickFn}('${j}',this)">${esc(nomJ(j))}</button>`).join('')}</div>`;
}
const val = id => $('#' + id)?.value?.trim() ?? '';
const optionsJoueurs = (sel, { vide = false, csc = false, videTxt = '— aucun —' } = {}) =>
  `${vide ? `<option value="">${videTxt}</option>` : ''}${csc ? `<option value="csc" ${sel === 'csc' ? 'selected' : ''}>CSC (contre son camp)</option>` : ''}${tousJoueurs().map(j => `<option value="${j.id}" ${sel === j.id ? 'selected' : ''}>${esc(j.nom)}${esc(numTxt(j))}</option>`).join('')}`;

/* ---------------- Présence ---------------- */
async function repondre(mid, rep, jid = Store.moi) {
  const m = Store.get('matchs', mid); if (!m || !jid) return;
  const cap = Store.capitaine;
  if (jid !== Store.moi && !cap) return;
  if (!cap && !reponsesOuvertes(m)) return toast('Les réponses sont fermées pour ce match');
  const max = +Store.config().maxJoueurs;
  if (rep === 'present' && max > 0 && !cap && reponse(mid, jid) !== 'present' && compteurs(m).p.length >= max) return toast(`Complet : ${max} joueurs maximum. Préviens le capitaine.`);
  const ok = await Store.set('presences', `${mid}_${jid}`, { match: mid, joueur: jid, reponse: rep, maj: Date.now() });
  if (ok) toast(rep === 'present' ? 'Présence enregistrée ✓' : 'Absence enregistrée');
}

/* Capitaine : changer le statut d'un joueur (match à venir ou déjà joué) */
function menuPresence(mid, jid) {
  const m = Store.get('matchs', mid), x = statutPresence(m, jid);
  const opt = (k, t, icone, coul) => `<button class="choix-joueur ${x === k ? 'on' : ''}" onclick="definirPresence('${mid}','${jid}',${k ? `'${k}'` : 'null'})"><span class="ms" style="color:${coul}">${icone}</span><span style="flex:1"><b>${t}</b></span>${x === k ? ic('check') : ''}</button>`;
  ouvrirFeuille(`<div class="flex" style="margin-bottom:8px">${avatar(jid, 'rond')}<h3 style="margin:0">${esc(nomJ(jid))}</h3></div>
    <p class="aide">${m.joue ? `A-t-il joué contre ${esc(adv(m).nom)} ?` : `Réponse pour le match contre ${esc(adv(m).nom)}`}</p>
    ${opt('present', m.joue ? 'A joué' : 'Présent', 'check_circle', 'var(--vert)')}
    ${opt('absent', 'Absent', 'cancel', 'var(--rouge)')}
    ${opt(null, m.joue ? 'Pas renseigné' : 'Sans réponse', 'help', 'var(--orange)')}
    ${m.joue && butsDe(mid).some(b => b.buteur === jid || b.passeur === jid) ? `<p class="aide">Il a marqué ou fait une passe dans ce match : il compte toujours comme ayant joué.</p>` : ''}`);
}
async function definirPresence(mid, jid, statut) {
  if (!Store.capitaine) return;
  const m = Store.get('matchs', mid), pid = `${mid}_${jid}`, ops = [];
  if (statut) ops.push({ op: 'set', col: 'presences', id: pid, obj: { match: mid, joueur: jid, reponse: statut, maj: Date.now() } });
  else if (Store.get('presences', pid)) ops.push({ op: 'del', col: 'presences', id: pid });
  if (m.joue) { // match joué : « Ont joué » suit la présence
    const oj = new Set(m.ontJoue || []);
    statut === 'present' ? oj.add(jid) : oj.delete(jid);
    ops.push({ op: 'patch', col: 'matchs', id: mid, obj: { ontJoue: [...oj] } });
  }
  if (!ops.length) return fermerFeuille();
  if (await Store.batch(ops)) { fermerFeuille(); toast(`${prenom(jid)} : ${statut === 'present' ? (m.joue ? 'a joué ✓' : 'présent ✓') : statut === 'absent' ? 'absent' : 'sans réponse'}`); }
}

/* Capitaine : ajouter au match un joueur occasionnel (vient dépanner) */
function formOccasionnel(mid) {
  const m = Store.get('matchs', mid), deja = new Set(compteurs(m).p);
  const anciens = tousJoueurs().filter(j => j.role === 'invite' && !deja.has(j.id));
  ouvrirFeuille(`<h3>Joueur occasionnel</h3>
    <p class="aide">Quelqu’un qui vient dépanner : ses buts comptent pour le match, mais il n’entre ni dans l’effectif ni dans les classements.</p>
    ${anciens.length ? `<label class="f">Déjà venu</label>${anciens.map(j => `<button class="choix-joueur" onclick="ajouterOccasionnel('${mid}','${j.id}')">${avatar(j.id, 's rond')}<span style="flex:1"><b>${esc(j.nom)}</b></span><span class="label or">${ic('add')} Ajouter</span></button>`).join('')}<label class="f">Ou quelqu’un de nouveau</label>` : `<label class="f">Prénom et nom</label>`}
    <input class="in" id="o-nom" placeholder="Ex. Lovely Aujla">
    <input class="in mt8" id="o-email" type="email" autocapitalize="off" placeholder="E-mail Google (facultatif)">
    <p class="aide">Avec son e-mail, il pourra se connecter et répondre lui-même aux prochains matchs.</p>
    <button class="btn" onclick="ajouterOccasionnel('${mid}')">${ic('person_add')} Ajouter au match</button>`);
}
async function ajouterOccasionnel(mid, jid) {
  if (!Store.capitaine) return;
  const m = Store.get('matchs', mid), ops = [];
  if (!jid) {
    const nom = val('o-nom'); if (!nom) return toast('Indique son prénom et son nom');
    const email = val('o-email').toLowerCase() || null;
    if (email && Store.liste('joueurs').some(x => x.email === email)) return toast('Cet e-mail est déjà utilisé par un autre joueur');
    const exist = Store.liste('joueurs').find(x => x.nom.toLowerCase() === nom.toLowerCase());
    if (exist) jid = exist.id;
    else { jid = nouvelId(); ops.push({ op: 'set', col: 'joueurs', id: jid, obj: { nom, numero: null, poste: null, role: 'invite', email } }); }
  }
  const conv = new Set(convoques(m)); conv.add(jid);
  const modif = { convoques: [...conv] };
  if (m.joue) { const oj = new Set(m.ontJoue || []); oj.add(jid); modif.ontJoue = [...oj]; }
  ops.push({ op: 'patch', col: 'matchs', id: mid, obj: modif });
  ops.push({ op: 'set', col: 'presences', id: `${mid}_${jid}`, obj: { match: mid, joueur: jid, reponse: 'present', maj: Date.now() } });
  if (await Store.batch(ops)) { fermerFeuille(); toast(`${nomJ(jid) === 'Ancien joueur' ? 'Joueur' : prenom(jid)} ajouté au match ✓`); }
}

/* ---------------- Match (créer / modifier) ---------------- */
function formMatch(id) {
  if (!Store.capitaine) return;
  const m = id ? Store.get('matchs', id) : null, cfg = Store.config();
  const d = m ? D(m.date) : (() => { const x = new Date(); x.setDate(x.getDate() + ((1 - x.getDay() + 7) % 7 || 7)); return x; })();
  F = { id, type: m?.type || 'Championnat', format: m?.format || '7', domicile: m ? !!m.domicile : true };
  F.convoques = new Set(m ? (Array.isArray(m.convoques) ? m.convoques : Object.keys(Store.data.joueurs)) : convocParDefaut(F.type));
  const advs = Store.liste('adversaires').sort((a, b) => a.nom.localeCompare(b.nom));
  const lieux = Store.liste('lieux').sort((a, b) => a.nom.localeCompare(b.nom));
  ouvrirFeuille(`<h3>${m ? 'Modifier le match' : 'Nouveau match'}</h3>
    <label class="f">Adversaire</label>
    <select class="in" id="f-adv" onchange="$('#f-adv-new').hidden=this.value!=='__new'">${advs.map(a => `<option value="${a.id}" ${m?.adversaire === a.id ? 'selected' : ''}>${esc(a.nom)}</option>`).join('')}<option value="__new" ${!advs.length ? 'selected' : ''}>+ Nouvel adversaire…</option></select>
    <input class="in mt8" id="f-adv-new" placeholder="Nom de l’équipe adverse" ${advs.length ? 'hidden' : ''}>
    <label class="f">Type</label>${choixHtml('type', TYPES, F.type, x => x, "majTypeMatch()")}
    <div id="f-journee-bloc" ${F.type === 'Championnat' ? '' : 'hidden'}><label class="f">Journée (${esc(cfg.championnat)})</label><input class="in" type="number" min="1" id="f-journee" value="${m?.journee ?? ''}" placeholder="Ex. 6 → « ${esc(cfg.championnat)} · J6 »"></div>
    <label class="f">Format</label>${choixHtml('format', FORMATS, F.format, x => 'Foot à ' + x)}
    <label class="f">Terrain</label>${choixHtml('domicile', [true, false], F.domicile, x => x ? 'Domicile' : 'Extérieur')}
    <div class="grille2"><div><label class="f">Date</label><input class="in" type="date" id="f-date" value="${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}"></div>
      <div><label class="f">Heure</label><input class="in" type="time" id="f-heure" value="${m ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '20:30'}"></div></div>
    <label class="f">Lieu</label>
    <select class="in" id="f-lieu" onchange="$('#f-lieu-new').hidden=this.value!=='__new'"><option value="">À préciser</option>${lieux.map(l => `<option value="${l.id}" ${m?.lieu === l.id ? 'selected' : ''}>${esc(l.nom)}</option>`).join('')}<option value="__new">+ Nouveau lieu…</option></select>
    <div id="f-lieu-new" hidden><input class="in mt8" id="f-lieu-nom" placeholder="Nom (ex. Stade Léo Lagrange)"><input class="in mt8" id="f-lieu-adr" placeholder="Adresse (facultatif)"></div>
    <label class="f">Convoqués (<span id="f-nconv">${F.convoques.size}</span>)</label>
    <div id="f-conv">${cochesHtml(tousJoueurs().map(j => j.id), F.convoques, 'basculeConvoque')}</div>
    <button class="btn" onclick="enregistrerMatch()">${ic('check')} Enregistrer</button>
    ${m ? `<button class="btn danger" onclick="supprimerMatch('${m.id}')">${ic('delete')} Supprimer le match</button>` : ''}`);
}
function convocParDefaut(type) {
  const c = Store.config().convocation?.[type];
  const ids = Object.keys(Store.data.joueurs);
  return Array.isArray(c) ? c.filter(x => ids.includes(x)) : ids.filter(id => joueur(id)?.role !== 'invite');
}
function majTypeMatch() {
  $('#f-journee-bloc').hidden = F.type !== 'Championnat';
  if (!F.id) { F.convoques = new Set(convocParDefaut(F.type)); $('#f-conv').innerHTML = cochesHtml(tousJoueurs().map(j => j.id), F.convoques, 'basculeConvoque'); $('#f-nconv').textContent = F.convoques.size; }
}
function basculeConvoque(j, btn) { F.convoques.has(j) ? F.convoques.delete(j) : F.convoques.add(j); btn.classList.toggle('on'); $('#f-nconv').textContent = F.convoques.size; }
async function enregistrerMatch() {
  const ops = [];
  let adversaire = val('f-adv');
  if (adversaire === '__new' || !adversaire) {
    const nom = val('f-adv-new'); if (!nom) return toast('Indique l’adversaire');
    const exist = Store.liste('adversaires').find(a => a.nom.toLowerCase() === nom.toLowerCase());
    if (exist) adversaire = exist.id;
    else { adversaire = nouvelId(); ops.push({ op: 'set', col: 'adversaires', id: adversaire, obj: { nom, logo: null } }); }
  }
  let lieu = val('f-lieu') || null;
  if (lieu === '__new') {
    const nom = val('f-lieu-nom'); if (!nom) return toast('Indique le nom du lieu');
    lieu = nouvelId(); ops.push({ op: 'set', col: 'lieux', id: lieu, obj: { nom, adresse: val('f-lieu-adr'), maps: '' } });
  }
  if (!val('f-date') || !val('f-heure')) return toast('Indique la date et l’heure');
  const date = new Date(`${val('f-date')}T${val('f-heure')}`).toISOString();
  const ancien = F.id ? Store.get('matchs', F.id) : null;
  const id = F.id || nouvelId();
  const obj = {
    scoreNous: null, scoreEux: null, joue: false, hommeDuMatch: null, ontJoue: [], compo: null,
    ...(ancien || {}),
    type: F.type, journee: F.type === 'Championnat' ? (+val('f-journee') || null) : null,
    format: F.format, domicile: !!F.domicile, date, lieu, adversaire,
    saison: saisonDe(date), convoques: [...F.convoques], limite: limiteReponse({ date })
  };
  if (obj.compo && ancien && ancien.format !== F.format) obj.compo = null; // la formation ne colle plus
  ops.push({ op: 'set', col: 'matchs', id, obj });
  if (await Store.batch(ops)) { fermerFeuille(); toast('Match enregistré'); if (!F.id) location.hash = '#/match/' + id + '/infos'; }
}
async function supprimerMatch(id) {
  if (!confirm('Supprimer ce match, ses buts, présences et votes ?')) return;
  const ops = [{ op: 'del', col: 'matchs', id }];
  ['buts', 'presences', 'votes'].forEach(c => Store.liste(c).filter(x => x.match === id).forEach(x => ops.push({ op: 'del', col: c, id: x.id })));
  if (await Store.batch(ops)) { fermerFeuille(); toast('Match supprimé'); location.hash = '#/calendrier'; }
}

/* ---------------- Résultat / feuille de match ---------------- */
function formResultat(id) {
  if (!Store.capitaine) return;
  const m = Store.get('matchs', id);
  const presents = compteurs(m).p;
  F = { id, nous: m.scoreNous ?? '', eux: m.scoreEux ?? '', hdm: m.hommeDuMatch || '',
    buts: butsDe(id).map(b => ({ buteur: b.buteur, passeur: b.passeur || '', minute: b.minute ?? '' })),
    ontJoue: new Set((m.ontJoue && m.ontJoue.length) ? m.ontJoue : presents) };
  rendreResultat();
}
function syncResultat() {
  if (!$('#r-nous')) return;
  F.nous = $('#r-nous').value; F.eux = $('#r-eux').value; F.hdm = $('#r-hdm').value;
  $$('.ligne-but').forEach((l, i) => { const [mi, bu, pa] = l.querySelectorAll('input,select'); F.buts[i] = { minute: mi.value, buteur: bu.value, passeur: pa.value }; });
}
function rendreResultat() {
  const m = Store.get('matchs', F.id), a = adv(m), cfg = Store.config();
  const scroll = $('#feuille')?.scrollTop || 0;
  ouvrirFeuille(`<h3>Feuille de match</h3><p class="aide">${esc(NOUS())} ${m.domicile ? 'reçoit' : 'chez'} ${esc(a.nom)} · ${fmtJourC(m.date)}</p>
    <div class="grille2"><div><label class="f">${esc(NOUS())}</label><input class="in" type="number" min="0" inputmode="numeric" id="r-nous" value="${F.nous}" style="font-family:var(--titre);font-size:34px;text-align:center;color:var(--or-2)"></div>
      <div><label class="f">${esc(a.nom)}</label><input class="in" type="number" min="0" inputmode="numeric" id="r-eux" value="${F.eux}" style="font-family:var(--titre);font-size:34px;text-align:center"></div></div>
    <label class="f">Buts (minute · buteur · passeur)</label>
    ${F.buts.map((b, i) => `<div class="ligne-but"><input class="in" type="number" min="0" max="130" placeholder="min" value="${b.minute}"><select class="in">${optionsJoueurs(b.buteur, { csc: true })}</select><select class="in">${optionsJoueurs(b.passeur, { vide: true, videTxt: 'Sans passe' })}</select><button onclick="syncResultat();F.buts.splice(${i},1);rendreResultat()" aria-label="Retirer">×</button></div>`).join('')}
    <button class="ajout" onclick="syncResultat();F.buts.push({buteur:tousJoueurs()[0]?.id||'csc',passeur:'',minute:''});rendreResultat()">${ic('add')} Ajouter un but</button>
    <label class="f">Ont joué (<span id="r-noj">${F.ontJoue.size}</span>)</label>
    ${cochesHtml(tousJoueurs().map(j => j.id), F.ontJoue, 'basculeOntJoue')}
    <label class="f">Homme du match ${cfg.hdmMode === 'vote' ? '(si personne ne vote)' : '(ton choix)'}</label>
    <select class="in" id="r-hdm">${optionsJoueurs(F.hdm, { vide: true })}</select>
    ${cfg.hdmMode === 'vote' ? `<p class="aide">Réglage : l’homme du match sera le résultat du vote des joueurs (${cfg.votesHeures} h après la validation).</p>` : ''}
    <button class="btn" onclick="enregistrerResultat()">${ic('sports_score')} Valider le résultat</button>
    ${m.joue ? `<button class="btn danger" onclick="annulerResultat('${m.id}')">Remettre le match « à venir »</button>` : ''}`);
  $('#feuille').scrollTop = scroll;
}
function basculeOntJoue(j, btn) { F.ontJoue.has(j) ? F.ontJoue.delete(j) : F.ontJoue.add(j); btn.classList.toggle('on'); $('#r-noj').textContent = F.ontJoue.size; }
async function enregistrerResultat() {
  syncResultat();
  const m = Store.get('matchs', F.id);
  if (F.nous === '' || F.eux === '') return toast('Indique le score');
  const nous = +F.nous, eux = +F.eux;
  if (F.buts.length !== nous && !confirm(`Le score indique ${nous} but(s) pour nous, mais ${F.buts.length} buteur(s) saisi(s). Valider quand même ?`)) return;
  const ops = [{ op: 'patch', col: 'matchs', id: m.id, obj: {
    scoreNous: nous, scoreEux: eux, joue: true, ontJoue: [...F.ontJoue], hommeDuMatch: F.hdm || null,
    votesFin: m.votesFin || Date.now() + (+Store.config().votesHeures || 48) * 3600e3 } }];
  butsDe(m.id).forEach(b => ops.push({ op: 'del', col: 'buts', id: b.id }));
  F.buts.forEach(b => ops.push({ op: 'set', col: 'buts', id: nouvelId(), obj: { match: m.id, buteur: b.buteur, passeur: b.passeur && b.passeur !== b.buteur ? b.passeur : null, minute: b.minute === '' ? null : +b.minute } }));
  if (await Store.batch(ops)) { fermerFeuille(); toast('Résultat enregistré ⚽'); location.replace('#/match/' + m.id + '/stats'); }
}
async function annulerResultat(id) {
  if (!confirm('Repasser ce match en « à venir » ? Le score sera effacé (les buts saisis aussi).')) return;
  const ops = [{ op: 'patch', col: 'matchs', id, obj: { joue: false, scoreNous: null, scoreEux: null, votesFin: null } }];
  butsDe(id).forEach(b => ops.push({ op: 'del', col: 'buts', id: b.id }));
  if (await Store.batch(ops)) { fermerFeuille(); toast('Match remis à venir'); }
}

/* ---------------- Joueurs ---------------- */
function formJoueur(id) {
  if (!Store.capitaine) return;
  const j = id ? joueur(id) : null;
  F = { id, poste: j?.poste || '', cap: j?.role === 'capitaine' };
  ouvrirFeuille(`<h3>${j ? 'Modifier le joueur' : 'Nouveau joueur'}</h3>
    <div class="grille3"><div><label class="f">Nom</label><input class="in" id="j-nom" value="${esc(j?.nom || '')}" placeholder="Prénom Nom"></div>
      <div><label class="f">Numéro (facultatif)</label><input class="in" type="number" min="0" max="99" inputmode="numeric" id="j-num" value="${j?.numero ?? ''}"></div></div>
    <label class="f">Poste (facultatif)</label>${choixHtml('poste', ['', ...POSTES], F.poste, x => x || 'Aucun')}
    <label class="f">E-mail Google (pour se connecter)</label><input class="in" type="email" id="j-email" value="${esc(j?.email || '')}" placeholder="prenom.nom@gmail.com" autocapitalize="off">
    <p class="aide">Le joueur se connecte avec ce compte Google : il est alors reconnu automatiquement.${j?.uid ? ' <b class="or-t">✓ Compte déjà lié.</b>' : ''}</p>
    <div class="inter"><span><b style="color:var(--blanc)">Joueur occasionnel</b><br><span class="aide">Vient dépanner : hors effectif et hors classements</span></span><label class="switch"><input type="checkbox" id="j-occ" ${j?.role === 'invite' ? 'checked' : ''}><i></i></label></div>
    <div class="inter"><span><b style="color:var(--blanc)">Capitaine</b><br><span class="aide">Accès à tous les réglages et à la saisie</span></span><label class="switch"><input type="checkbox" id="j-cap" ${F.cap ? 'checked' : ''}><i></i></label></div>
    <button class="btn" onclick="enregistrerJoueur()">${ic('check')} Enregistrer</button>
    ${j && id !== Store.moi ? `<button class="btn danger" onclick="supprimerJoueur('${id}')">${ic('person_remove')} Retirer de l’effectif</button>` : ''}`);
}
async function enregistrerJoueur() {
  const nom = val('j-nom'); if (!nom) return toast('Indique le nom');
  const email = val('j-email').toLowerCase();
  if (email && Store.liste('joueurs').some(x => x.email === email && x.id !== F.id)) return toast('Cet e-mail est déjà utilisé par un autre joueur');
  const ancien = F.id ? joueur(F.id) : null;
  const role = $('#j-cap').checked ? 'capitaine' : $('#j-occ').checked ? 'invite' : 'joueur';
  if (ancien && F.id === Store.moi && role !== 'capitaine' && !confirm('Tu vas perdre tes droits de capitaine. Continuer ?')) return;
  const id = F.id || nouvelId();
  const obj = { ...(ancien || {}), nom, numero: val('j-num') === '' ? null : +val('j-num'), poste: F.poste || null, email, role };
  if (await Store.set('joueurs', id, obj)) {
    if (ancien && ancien.role !== role) await Store.majAcces({ ...obj, id });
    fermerFeuille(); toast('Effectif mis à jour');
  }
}
async function supprimerJoueur(id) {
  const j = joueur(id);
  if (!confirm(`Retirer ${j.nom} de l’effectif ? Ses stats passées resteront (« Ancien joueur »).`)) return;
  const ops = [{ op: 'del', col: 'joueurs', id }];
  if (Store.mode === 'firebase' && j.uid) ops.push({ op: 'del', col: 'acces', id: j.uid });
  if (await Store.batch(ops)) { fermerFeuille(); toast('Joueur retiré'); location.hash = '#/effectif'; }
}
async function changerPhoto(jid) {
  const photo = await choisirPhoto(); if (!photo) return;
  if (await Store.patch('joueurs', jid, { photo })) {
    if (!Store.capitaine && Store.mode === 'firebase' && Store.get('profils', jid)) await Store.patch('profils', jid, { photo });
    toast('Photo mise à jour 📸');
  }
}

/* ---------------- Compo ---------------- */
function compoCreer(mid) {
  const m = Store.get('matchs', mid), f = (FORMATIONS[m.format] || FORMATIONS['7'])[0];
  App.etat.compo = { match: mid, nom: 'Compo ' + (m.journee ? 'J' + m.journee : adv(m).nom), formation: f, postes: {}, remplacants: [] };
  autoPlacer(); render();
}
function compoModifier(mid) {
  const c = Store.get('matchs', mid).compo;
  App.etat.compo = { match: mid, nom: c.nom || '', formation: c.formation, postes: { ...(c.postes || {}) }, remplacants: [...(c.remplacants || [])] };
  render();
}
/* Place automatiquement les présents selon leur poste (modifiable ensuite) */
function autoPlacer() {
  const c = App.etat.compo, m = Store.get('matchs', c.match);
  const libres = compteurs(m).p.filter(j => !Object.values(c.postes).includes(j));
  const role = { GAR: 'Gardien', DEF: 'Défenseur', MIL: 'Milieu', ATT: 'Attaquant' };
  const slots = emplacements(c.formation).filter(s => !c.postes[s.id]);
  slots.forEach(s => { const i = libres.findIndex(j => joueur(j)?.poste === role[s.role]); if (i >= 0) c.postes[s.id] = libres.splice(i, 1)[0]; });
  slots.filter(s => !c.postes[s.id] && s.id !== 'G').forEach(s => { if (libres.length) c.postes[s.id] = libres.shift(); });
  c.remplacants = [...new Set([...c.remplacants, ...libres])];
}
function compoFormation(f) {
  const c = App.etat.compo, ids = emplacements(f).map(s => s.id), nouv = {};
  Object.entries(c.postes).forEach(([s, j]) => { if (ids.includes(s)) nouv[s] = j; else if (j && !c.remplacants.includes(j)) c.remplacants.push(j); });
  c.formation = f; c.postes = nouv; render();
}
function compoChoisir(slot) {
  const c = App.etat.compo, m = Store.get('matchs', c.match), cpt = compteurs(m);
  const ou = j => { const s = Object.entries(c.postes).find(([, x]) => x === j); return s ? s[0] : c.remplacants.includes(j) ? 'Remplaçant' : ''; };
  const btn = j => `<button class="choix-joueur ${c.postes[slot] === j ? 'on' : ''}" onclick="compoPlacer('${slot}','${j}')">${avatar(j, 's')}<span style="flex:1"><b>${esc(nomJ(j))}</b> <span>${[numTxt(joueur(j), '#'), joueur(j)?.poste].filter(Boolean).map(esc).join(' · ')}</span></span><span class="label or">${ou(j)}</span></button>`;
  ouvrirFeuille(`<h3>Emplacement ${esc(slot)}</h3><p class="aide">Joueurs marqués présents. Toucher un joueur déjà placé l’échange de place.</p>
    ${cpt.p.map(btn).join('') || '<p class="aide">Aucun joueur présent pour l’instant.</p>'}
    ${cpt.q.length ? `<label class="f">Sans réponse</label>${cpt.q.map(btn).join('')}` : ''}
    ${c.postes[slot] ? `<button class="btn danger" onclick="compoPlacer('${slot}',null)">Vider l’emplacement</button>` : ''}`);
}
function compoPlacer(slot, j) {
  const c = App.etat.compo, actuel = c.postes[slot];
  if (j) {
    const ancienSlot = Object.keys(c.postes).find(s => c.postes[s] === j);
    if (ancienSlot) { if (actuel) c.postes[ancienSlot] = actuel; else delete c.postes[ancienSlot]; }
    else if (actuel && !c.remplacants.includes(actuel)) c.remplacants.push(actuel);
    c.remplacants = c.remplacants.filter(x => x !== j);
    c.postes[slot] = j;
  } else { delete c.postes[slot]; if (actuel && !c.remplacants.includes(actuel)) c.remplacants.push(actuel); }
  fermerFeuille(); render();
}
function compoAjouterRemp() {
  const c = App.etat.compo, m = Store.get('matchs', c.match), cpt = compteurs(m);
  const dispo = [...cpt.p, ...cpt.q].filter(j => !Object.values(c.postes).includes(j) && !c.remplacants.includes(j));
  F = { remp: new Set() };
  ouvrirFeuille(`<h3>Remplaçants</h3><p class="aide">Joueurs pas encore placés.</p>
    ${dispo.length ? cochesHtml(dispo, F.remp, 'basculeRemp') : '<p class="aide">Tout le monde est déjà placé.</p>'}
    <button class="btn" onclick="App.etat.compo.remplacants.push(...F.remp);fermerFeuille();render()">${ic('check')} Ajouter</button>`);
}
function basculeRemp(j, btn) { F.remp.has(j) ? F.remp.delete(j) : F.remp.add(j); btn.classList.toggle('on'); }
function compoRetirerRemp(j) { App.etat.compo.remplacants = App.etat.compo.remplacants.filter(x => x !== j); render(); }
async function compoEnregistrer() {
  const c = App.etat.compo;
  const compo = { nom: c.nom || 'Composition', formation: c.formation, postes: c.postes, remplacants: c.remplacants };
  if (await Store.patch('matchs', c.match, { compo })) { App.etat.compo = null; toast('Compo enregistrée ✓'); render(); }
}
async function compoSupprimer(mid) {
  if (!confirm('Supprimer la compo ?')) return;
  if (await Store.patch('matchs', mid, { compo: null })) { App.etat.compo = null; toast('Compo supprimée'); render(); }
}

/* ---------------- Votes ---------------- */
async function enregistrerVote() {
  const v = App.etat.vote, m = Store.get('matchs', v.match);
  if (!votesOuverts(m)) return toast('Les votes sont clos');
  if (!v.hdm) { App.etat.voteTab = 'hdm'; render(); return toast('Choisis d’abord ton homme du match'); }
  if (await Store.set('votes', `${v.match}_${Store.moi}`, { match: v.match, joueur: Store.moi, hommeDuMatch: v.hdm, maj: Date.now() })) {
    toast('Vote enregistré ✓'); App.etat.voteTab = 'resultats'; render();
  }
}

/* Notes sur 10 : le capitaine note tous ceux qui ont joué, lui compris */
function formNotes(mid) {
  if (!Store.capitaine) return;
  const m = Store.get('matchs', mid);
  F = { notes: { ...(m.notes || {}) } };
  const ids = [...aJoueSet(m)].sort((a, b) => nomJ(a).localeCompare(nomJ(b)));
  ouvrirFeuille(`<h3>Notes du match</h3><p class="aide">Note sur 10 chaque joueur, toi compris. Laisse « – » pour ne pas noter. Seul le capitaine peut noter.</p>
    <div class="carte mt12">${ids.map(j => `<div class="note-ligne">${avatar(j, 's')}<b style="flex:0 0 110px;color:var(--blanc);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(prenom(j))}${j === Store.moi ? ' (toi)' : ''}</b>
      <input type="range" min="0" max="10" step="0.5" value="${F.notes[j] ?? 0}" oninput="const v=+this.value;if(v)F.notes['${j}']=v;else delete F.notes['${j}'];this.nextElementSibling.textContent=v?String(v).replace('.',','):'–'"><output>${F.notes[j] != null ? String(F.notes[j]).replace('.', ',') : '–'}</output></div>`).join('') || '<p class="aide" style="padding:14px">Coche d’abord qui a joué (onglet Présences).</p>'}</div>
    <button class="btn" onclick="enregistrerNotes('${mid}')">${ic('check')} Enregistrer les notes</button>`);
}
async function enregistrerNotes(mid) {
  if (await Store.patch('matchs', mid, { notes: F.notes })) { fermerFeuille(); toast('Notes enregistrées ✓'); }
}

/* ---------------- Paiements ---------------- */
async function basculePaiement(pid, j) {
  const p = Store.get('paiements', pid);
  await Store.patch('paiements', pid, { joueurs: { ...p.joueurs, [j]: !p.joueurs[j] } });
}
function formCollecte(id) {
  const p = id ? Store.get('paiements', id) : null;
  F = { id, sel: new Set(p ? Object.keys(p.joueurs || {}) : Object.keys(Store.data.joueurs)) };
  ouvrirFeuille(`<h3>${p ? 'Modifier la collecte' : 'Nouvelle collecte'}</h3>
    <label class="f">Libellé</label><input class="in" id="c-lib" value="${esc(p?.libelle || '')}" placeholder="Ex. Cotisation saison, inscription tournoi">
    <div class="grille2"><div><label class="f">Montant (€ / joueur)</label><input class="in" type="number" min="0" step="0.5" inputmode="decimal" id="c-mt" value="${p?.montant ?? ''}"></div>
      <div><label class="f">Échéance</label><input class="in" type="date" id="c-ech" value="${esc(p?.echeance || '')}"></div></div>
    <label class="f">Joueurs concernés (<span id="c-n">${F.sel.size}</span>)</label>
    <div class="entre" style="margin-bottom:6px"><button class="lien-btn" onclick="F.sel=new Set(Object.keys(Store.data.joueurs));$('#c-coches').innerHTML=cochesHtml(tousJoueurs().map(j=>j.id),F.sel,'basculeConcerne');$('#c-n').textContent=F.sel.size">Tout cocher</button><button class="lien-btn" onclick="F.sel=new Set();$('#c-coches').innerHTML=cochesHtml(tousJoueurs().map(j=>j.id),F.sel,'basculeConcerne');$('#c-n').textContent=0">Tout décocher</button></div>
    <div id="c-coches">${cochesHtml(tousJoueurs().map(j => j.id), F.sel, 'basculeConcerne')}</div>
    <p class="aide">Aucun paiement en ligne : tu coches ensuite qui a payé.</p>
    <button class="btn" onclick="enregistrerCollecte()">${ic('check')} Enregistrer</button>
    ${p ? `<button class="btn danger" onclick="supprimerCollecte('${id}')">${ic('delete')} Supprimer</button>` : ''}`);
}
function basculeConcerne(j, btn) { F.sel.has(j) ? F.sel.delete(j) : F.sel.add(j); btn.classList.toggle('on'); $('#c-n').textContent = F.sel.size; }
async function enregistrerCollecte() {
  const libelle = val('c-lib'); if (!libelle) return toast('Indique un libellé');
  const ancien = F.id ? Store.get('paiements', F.id) : null;
  const joueurs = {}; F.sel.forEach(j => joueurs[j] = !!ancien?.joueurs?.[j]);
  const id = F.id || nouvelId();
  if (await Store.set('paiements', id, { ...(ancien || {}), libelle, montant: +val('c-mt') || 0, echeance: val('c-ech'), saison: ancien?.saison || Store.config().saison, joueurs })) {
    fermerFeuille(); toast('Collecte enregistrée'); location.replace('#/paiements/' + id);
  }
}
async function supprimerCollecte(id) {
  if (!confirm('Supprimer cette collecte ?')) return;
  if (await Store.del('paiements', id)) { fermerFeuille(); location.replace('#/paiements'); }
}

/* ---------------- Classement FSGT ---------------- */
function formClassement() {
  const c = Store.get('equipe', 'classement');
  F = { lignes: (c?.lignes || []).map(l => ({ ...l })) };
  F.lignes.forEach(l => { l.pts = ptsFSGT(l); });
  if (!F.lignes.length) F.lignes.push({ equipe: NOUS(), pts: 0, j: 0, v: 0, n: 0, d: 0, bp: 0, bc: 0 });
  rendreClassementForm();
}
function syncClassement() { $$('.cl-ligne').forEach((l, i) => { const ins = l.querySelectorAll('input'); F.lignes[i] = { equipe: ins[0].value.trim(), pts: +ins[1].value || 0, j: +ins[2].value || 0, v: +ins[3].value || 0, n: +ins[4].value || 0, d: +ins[5].value || 0, bp: +ins[6].value || 0, bc: +ins[7].value || 0 }; }); }
function rendreClassementForm() {
  const n = (v, w = 44) => `<input class="in" type="number" min="0" inputmode="numeric" value="${v ?? 0}" style="width:${w}px;padding:8px 4px;text-align:center;font-size:13px">`;
  ouvrirFeuille(`<h3>Classement du groupe</h3><p class="aide">Recopie le tableau du site officiel, points compris (barème FSGT : V = 3, N = 2, D = 1, forfait / pénalité = 0).</p>
    <div class="tab-scroll mt12"><div style="min-width:480px">
    <div class="flex label" style="gap:4px"><span style="flex:1">Équipe</span><span style="width:44px;text-align:center">Pts</span><span style="width:44px;text-align:center">J</span><span style="width:44px;text-align:center">V</span><span style="width:44px;text-align:center">N</span><span style="width:44px;text-align:center">D</span><span style="width:44px;text-align:center">BP</span><span style="width:44px;text-align:center">BC</span><span style="width:24px"></span></div>
    ${F.lignes.map((l, i) => `<div class="flex cl-ligne mt8" style="gap:4px"><input class="in" value="${esc(l.equipe)}" style="flex:1;padding:8px;font-size:13px;min-width:110px">${n(l.pts)}${n(l.j)}${n(l.v)}${n(l.n)}${n(l.d)}${n(l.bp)}${n(l.bc)}<button style="width:24px;color:#FCA5A5;font-size:18px" onclick="syncClassement();F.lignes.splice(${i},1);rendreClassementForm()">×</button></div>`).join('')}
    </div></div>
    <button class="ajout" onclick="syncClassement();F.lignes.push({equipe:'',pts:0,j:0,v:0,n:0,d:0,bp:0,bc:0});rendreClassementForm()">${ic('add')} Ajouter une équipe</button>
    <button class="btn" onclick="enregistrerClassement()">${ic('check')} Enregistrer</button>`);
}
/* Coller le tableau copié sur le site FSGT */
function formCollerClassement() {
  F = { colle: [] };
  ouvrirFeuille(`<h3>Coller le classement</h3>
    <p class="aide">1. Sur le site FSGT (Foot à 7 → 93 Groupe 1), sélectionne tout le tableau, de « N° Equipe » jusqu’à la dernière équipe, et copie-le (Ctrl+C).<br>2. Colle-le ici (Ctrl+V).</p>
    <a class="lien-btn" href="https://www.footfsgtidf.org/" target="_blank" rel="noopener">${ic('open_in_new')} Ouvrir le site FSGT</a>
    <textarea class="in mt8" id="cl-colle" rows="6" placeholder="Colle le tableau ici…" style="font-size:12px;font-family:monospace" oninput="apercuCollerClassement()"></textarea>
    <div id="cl-apercu"></div>
    <button class="btn" id="cl-ok" disabled onclick="enregistrerCollerClassement()">${ic('check')} Enregistrer</button>`);
}
function apercuCollerClassement() {
  F.colle = lireClassementColle($('#cl-colle').value);
  const vide = !$('#cl-colle').value.trim();
  $('#cl-apercu').innerHTML = vide ? '' : F.colle.length
    ? `<div class="alerte vert">${ic('check_circle')}<span><b>${F.colle.length} équipes</b> trouvées. Vérifie l’aperçu puis enregistre.</span></div>${tableauClassement(trierClassement(F.colle))}`
    : `<div class="alerte">${ic('warning')}<span>Je ne reconnais pas le tableau. Copie bien toutes les lignes, du « 1 » jusqu’à la dernière équipe.</span></div>`;
  $('#cl-ok').disabled = !F.colle.length;
}
async function enregistrerCollerClassement() {
  if (!F.colle?.length) return;
  if (await Store.set('equipe', 'classement', { lignes: F.colle, maj: new Date().toISOString().slice(0, 10) })) { fermerFeuille(); toast('Classement mis à jour ✓'); }
}

async function enregistrerClassement() {
  syncClassement();
  const lignes = F.lignes.filter(l => l.equipe);
  if (await Store.set('equipe', 'classement', { lignes, maj: new Date().toISOString().slice(0, 10) })) { fermerFeuille(); toast('Classement mis à jour'); }
}

/* ---------------- Réglages ---------------- */
async function sauverConfig(modif, msg = 'Réglages enregistrés') {
  const cfg = { ...Store.config(), ...modif }; delete cfg.id;
  if (await Store.set('equipe', 'config', cfg)) { fermerFeuille(); toast(msg); return true; }
  return false;
}
function formEquipe() {
  const c = Store.config(); F = { logo: c.logo || null };
  const an = new Date().getFullYear(), ss = [...new Set([c.saison, `${an - 1}-${an}`, `${an}-${an + 1}`, `${an + 1}-${an + 2}`])].sort();
  ouvrirFeuille(`<h3>Détails de l’équipe</h3>
    <div class="flex mt12"><div id="e-logo">${ecussonNous(64)}</div><div><button class="lien-btn" onclick="logoEquipe()">${ic('upload')} Changer le logo</button><br><button class="lien-btn" style="color:var(--gris)" onclick="F.logo=null;$('#e-logo').innerHTML='<div class=&quot;ecusson nous&quot; style=&quot;width:64px;height:64px&quot;><img src=&quot;assets/logo-256.png&quot;></div>'">Logo officiel</button></div></div>
    <label class="f">Nom</label><input class="in" id="e-nom" value="${esc(c.nom)}">
    <label class="f">Saison en cours</label><select class="in" id="e-saison">${ss.map(s => `<option ${s === c.saison ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <div class="grille2"><div><label class="f">Championnat</label><input class="in" id="e-champ" value="${esc(c.championnat)}"></div><div><label class="f">Couleurs</label><input class="in" id="e-coul" value="${esc(c.couleurs || '')}"></div></div>
    <label class="f">Groupe</label><input class="in" id="e-groupe" value="${esc(c.groupe || '')}">
    <button class="btn" onclick="sauverConfig({nom:val('e-nom')||'Akaal FC',saison:val('e-saison'),championnat:val('e-champ')||'FSGT',couleurs:val('e-coul'),groupe:val('e-groupe'),logo:F.logo})">${ic('check')} Enregistrer</button>`);
}
async function logoEquipe() { const p = await choisirPhoto(); if (p) { F.logo = p; $('#e-logo').innerHTML = `<div class="ecusson nous" style="width:64px;height:64px"><img src="${p}"></div>`; } }
function formVotes() {
  const c = Store.config(); F = { hdmMode: c.hdmMode, votesHeures: String(c.votesHeures) };
  ouvrirFeuille(`<h3>Votes et notes</h3><p class="aide">Après un match, chaque joueur qui a joué vote pour l’homme du match. Les notes sur 10 sont données par le capitaine seul (fiche match → Stats → « Noter les joueurs »).</p>
    <label class="f">Homme du match =</label>${choixHtml('hdmMode', ['vote', 'capitaine'], F.hdmMode, x => x === 'vote' ? 'Résultat du vote' : 'Mon choix')}
    <label class="f">Fermeture des votes après</label>${choixHtml('votesHeures', ['24', '48', '72'], F.votesHeures, x => x + ' h')}
    <button class="btn" onclick="sauverConfig({hdmMode:F.hdmMode,votesHeures:+F.votesHeures})">${ic('check')} Enregistrer</button>`);
}
function formMembres() {
  const c = Store.config();
  F = { conv: {} }; TYPES.forEach(t => F.conv[t] = Array.isArray(c.convocation?.[t]) ? new Set(c.convocation[t]) : null);
  reafficheMembres();
}
function reafficheMembres() { // ré-affiche avec l'état courant de F.conv
  const conv = F.conv, ids = tousJoueurs().map(j => j.id);
  const bloc = t => `<div class="carte pad mt12"><div class="entre"><b style="color:var(--blanc)">${t}</b>
    <div class="choix"><button class="${conv[t] ? '' : 'on'}" onclick="F.conv['${t}']=null;reafficheMembres()">Tout l’effectif</button><button class="${conv[t] ? 'on' : ''}" onclick="F.conv['${t}']=F.conv['${t}']||new Set(Object.keys(Store.data.joueurs));reafficheMembres()">Sélection</button></div></div>
    ${conv[t] ? `<div class="mt12">${cochesHtml(ids, conv[t], `basculeMembre${TYPES.indexOf(t)}`)}</div>` : ''}</div>`;
  ouvrirFeuille(`<h3>Membres concernés</h3><p class="aide">Joueurs convoqués par défaut à la création d’un match (modifiable match par match).</p>
    ${TYPES.map(bloc).join('')}
    <button class="btn" onclick="sauverConfig({convocation:Object.fromEntries(TYPES.map(t=>[t,F.conv[t]?[...F.conv[t]]:null]))})">${ic('check')} Enregistrer</button>`);
}
TYPES.forEach((t, i) => window['basculeMembre' + i] = (j, b) => { const s = F.conv[t]; s.has(j) ? s.delete(j) : s.add(j); b.classList.toggle('on'); });
function formPresences() {
  const c = Store.config(); F = { limiteJours: String(c.limiteJours) };
  ouvrirFeuille(`<h3>Gestion des présences</h3>
    <label class="f">Date limite de réponse</label>${choixHtml('limiteJours', ['-1', '0', '1', '2'], F.limiteJours, x => ({ '-1': 'Jusqu’au match', '0': 'Le jour même', '1': 'La veille', '2': '2 jours avant' })[x])}
    <label class="f">À quelle heure</label><input class="in" type="time" id="p-heure" value="${esc(c.limiteHeure || '20:00')}">
    <label class="f">Nombre maximum de joueurs (0 = pas de limite)</label><input class="in" type="number" min="0" inputmode="numeric" id="p-max" value="${+c.maxJoueurs || 0}">
    <p class="aide">Le capitaine peut toujours changer la réponse d’un joueur (onglet Présences d’un match), même après la date limite.</p>
    <button class="btn" onclick="enregistrerPresences()">${ic('check')} Enregistrer</button>`);
}
async function enregistrerPresences() {
  const modif = { limiteJours: +F.limiteJours, limiteHeure: val('p-heure') || '20:00', maxJoueurs: +val('p-max') || 0 };
  const cfg = { ...Store.config(), ...modif }; delete cfg.id;
  // On recalcule la date limite des matchs à venir (elle sert aux règles de sécurité)
  const ops = [{ op: 'set', col: 'equipe', id: 'config', obj: cfg }];
  aVenir().forEach(m => ops.push({ op: 'patch', col: 'matchs', id: m.id, obj: { limite: limiteReponse(m, cfg) } }));
  if (await Store.batch(ops)) { fermerFeuille(); toast('Réglages enregistrés'); }
}

/* ---------------- Lieux & adversaires ---------------- */
function formLieu(id) {
  const l = id ? Store.get('lieux', id) : null;
  ouvrirFeuille(`<h3>${l ? 'Modifier le lieu' : 'Nouveau lieu'}</h3>
    <label class="f">Nom</label><input class="in" id="l-nom" value="${esc(l?.nom || '')}" placeholder="Stade Léo Lagrange">
    <label class="f">Adresse</label><input class="in" id="l-adr" value="${esc(l?.adresse || '')}" placeholder="Rue…, 93000 Bobigny">
    <label class="f">Lien Google Maps (facultatif)</label><input class="in" id="l-maps" value="${esc(l?.maps || '')}" placeholder="https://maps.app.goo.gl/…" autocapitalize="off">
    <p class="aide">Sans lien, l’app cherche le nom + l’adresse dans Google Maps.</p>
    <button class="btn" onclick="enregistrerLieu('${id || ''}')">${ic('check')} Enregistrer</button>
    ${l ? `<button class="btn danger" onclick="supprimerRef('lieux','${id}','lieu')">${ic('delete')} Supprimer</button>` : ''}`);
}
async function enregistrerLieu(id) {
  const nom = val('l-nom'); if (!nom) return toast('Indique le nom');
  if (await Store.set('lieux', id || nouvelId(), { nom, adresse: val('l-adr'), maps: val('l-maps') })) { fermerFeuille(); toast('Lieu enregistré'); }
}
function formAdversaire(id) {
  const a = id ? Store.get('adversaires', id) : null; F = { logo: a?.logo || null };
  const f = a ? faceAFace(id) : null;
  ouvrirFeuille(`<h3>${a ? esc(a.nom) : 'Nouvel adversaire'}</h3>
    <div class="flex mt12"><div id="a-logo">${ecussonAdv(F, 64)}</div><div><button class="lien-btn" onclick="logoAdv()">${ic('upload')} Logo (facultatif)</button>${F.logo ? `<br><button class="lien-btn" style="color:var(--gris)" onclick="F.logo=null;$('#a-logo').innerHTML=ecussonAdv(F,64)">Retirer</button>` : ''}</div></div>
    <label class="f">Nom</label><input class="in" id="a-nom" value="${esc(a?.nom || '')}">
    ${f && f.j ? `<label class="f">Face-à-face</label><div class="kpis"><div class="kpi"><b>${f.j}</b><span>J</span></div><div class="kpi v"><b>${f.v}</b><span>V</span></div><div class="kpi"><b>${f.n}</b><span>N</span></div><div class="kpi d"><b>${f.d}</b><span>D</span></div></div><p class="aide">Buts : ${f.bp} marqués, ${f.bc} encaissés</p>` : ''}
    <button class="btn" onclick="enregistrerAdv('${id || ''}')">${ic('check')} Enregistrer</button>
    ${a ? `<button class="btn danger" onclick="supprimerRef('adversaires','${id}','adversaire')">${ic('delete')} Supprimer</button>` : ''}`);
}
async function logoAdv() { const p = await choisirPhoto(); if (p) { F.logo = p; $('#a-logo').innerHTML = ecussonAdv(F, 64); } }
async function enregistrerAdv(id) {
  const nom = val('a-nom'); if (!nom) return toast('Indique le nom');
  if (await Store.set('adversaires', id || nouvelId(), { nom, logo: F.logo })) { fermerFeuille(); toast('Adversaire enregistré'); }
}
async function supprimerRef(col, id, champ) {
  const n = Store.liste('matchs').filter(m => m[champ] === id).length;
  if (n) return toast(`Impossible : utilisé par ${n} match${n > 1 ? 's' : ''}`);
  if (!confirm('Supprimer ?')) return;
  if (await Store.del(col, id)) { fermerFeuille(); toast('Supprimé'); }
}

/* ---------------- Premier lancement (capitaine) ---------------- */
function formCreerEquipe() {
  ouvrirFeuille(`<h3>Créer l’équipe</h3><p class="aide">Seulement pour le capitaine dont l’e-mail est inscrit dans les règles Firestore.</p>
    <button class="btn" onclick="fermerFeuille();toast('Création en cours…');Store.creerEquipe('', '', true)">${ic('cloud_download')} Avec les données SportEasy</button>
    <p class="aide">12 joueurs, 11 adversaires, 6 matchs déjà joués. Tu seras « Simrat Kohar », capitaine.</p>
    <label class="f">Ou partir d’une équipe vide</label>
    <div class="grille3"><div><label class="f">Ton nom</label><input class="in" id="ce-nom" value="${esc(Store.user?.nom || '')}"></div><div><label class="f">Numéro</label><input class="in" type="number" id="ce-num" value="10"></div></div>
    <button class="btn gris" onclick="fermerFeuille();Store.creerEquipe(val('ce-nom')||'Capitaine',val('ce-num'))">${ic('shield_person')} Équipe vide</button>`);
}

/* ---------------- Partage / WhatsApp ---------------- */
const urlApp = () => location.origin + location.pathname;
function whatsapp(texte) { window.open('https://wa.me/?text=' + encodeURIComponent(texte), '_blank'); }
async function partager(texte, titre = 'Akaal FC') {
  if (navigator.share) { try { await navigator.share({ title: titre, text: texte }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  whatsapp(texte);
}
function relanceWhatsApp(mid) {
  const m = Store.get('matchs', mid), c = compteurs(m), l = lieuDe(m);
  whatsapp(`⚽ ${NOUS()} vs ${adv(m).nom} — ${maj1(fmtJour(m.date))} à ${fmtHeure(m.date)}${l ? ' · ' + l.nom : ''}\n\nOn attend encore la réponse de : ${c.q.map(prenom).join(', ')}.\nRépondez Présent / Absent sur l'app 👉 ${urlApp()}\n\n✅ ${c.p.length} présents pour l'instant.`);
}
function relancePaiement(pid) {
  const p = Store.get('paiements', pid), imp = Object.keys(p.joueurs).filter(j => !p.joueurs[j] && joueur(j));
  whatsapp(`💰 ${p.libelle} (${p.montant} €)${p.echeance ? ' — avant le ' + p.echeance.split('-').reverse().join('/') : ''}\n\nPas encore reçu de : ${imp.map(prenom).join(', ')}.\nMerci de régler au capitaine (espèces ou virement) 🙏`);
}
function partagerResultat(mid) {
  const m = Store.get('matchs', mid), [g, d] = equipesOrdre(m), h = hommeDuMatch(m);
  const bs = butsDe(mid).map(b => `⚽ ${nomJ(b.buteur)}${b.minute != null ? ' ' + b.minute + "'" : ''}${b.passeur ? ' (passe ' + prenom(b.passeur) + ')' : ''}`).join('\n');
  partager(`${typeCourt(m)} — ${g.nom} ${g.score} - ${d.score} ${d.nom}\n\n${bs}${h ? `\n\n⭐ Homme du match : ${nomJ(h)}` : ''}\n\n${urlApp()}`);
}
function partagerCompo(mid) {
  const m = Store.get('matchs', mid), c = m.compo;
  const ordre = emplacements(c.formation).map(s => c.postes[s.id] ? `${s.role} : ${nomJ(c.postes[s.id])}` : null).filter(Boolean).join('\n');
  partager(`📋 ${c.nom || 'Compo'} (${c.formation}) — ${NOUS()} vs ${adv(m).nom}, ${fmtJourC(m.date)} ${fmtHeure(m.date)}\n\n${ordre}${c.remplacants?.length ? `\n\nRemplaçants : ${c.remplacants.map(prenom).join(', ')}` : ''}\n\n${urlApp()}`);
}
async function partagerLien() {
  const t = `Rejoins l'app d'${NOUS()} ⚽ : ${urlApp()}\nConnecte-toi avec ton compte Google, puis ajoute l'app à ton écran d'accueil (iPhone : Safari → Partager → Sur l'écran d'accueil).`;
  if (navigator.share) { try { await navigator.share({ title: NOUS(), text: t }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(t); toast('Lien copié ✓'); } catch { whatsapp(t); }
}
